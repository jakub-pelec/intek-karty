import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  cards,
  collections,
  matches,
  users,
  type MatchKind,
} from "@/db/schema";
import { liveCms } from "@/lib/cms/live";
import { pickClosestOpponent } from "@/lib/game/matchmaking";
import {
  parseEffectKind,
  parseEffectTag,
  parseGameTags,
  type LineupSnapshotCard,
} from "@/lib/game/play-card";
import { ratingPair, winnerFromScores } from "@/lib/game/rating";
import { scoreLineup } from "@/lib/game/score";
import { parseLineupSnapshot, snapshotToPlayCards } from "@/lib/game/snapshot";
import {
  DECK_SIZE,
  PRACTICE_OPPONENT_NAME,
  STARTING_RATING,
} from "@/lib/game/types";
import {
  buildMatchPayload,
  canDevControlMatch,
  canRevealMatch,
  canViewMatch,
  type MatchPayload,
  type MatchRecord,
  type MatchViewer,
} from "@/lib/game/view-match";
import { getActiveLineup, listQueueReadyPlayers } from "@/db/queries/decks";

export class MatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchError";
  }
}

function asRecord(row: typeof matches.$inferSelect): MatchRecord {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    revealedCount: row.revealedCount,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    playerAName: row.playerAName,
    playerBName: row.playerBName,
    playerARating: row.playerARating,
    playerBRating: row.playerBRating,
    playerALineup: parseLineupSnapshot(row.playerALineup),
    playerBLineup: parseLineupSnapshot(row.playerBLineup),
    winnerSide: row.winnerSide,
    ratingDeltaA: row.ratingDeltaA,
    ratingDeltaB: row.ratingDeltaB,
  };
}

function shadeFromCatalogRow(row: {
  cardId: string;
  number: number;
  name: string;
  description: string;
  rarity: LineupSnapshotCard["rarity"];
  imageUrl: string | null;
  holoMapUrl: string | null;
  signed: boolean;
  tags: string[] | null;
  basePoints: number;
  effectKind: string | null;
  effectTag: string | null;
  effectValue: number | null;
  effectThreshold: number | null;
  backImageUrl: string | null;
}): LineupSnapshotCard {
  return {
    cardId: row.cardId,
    number: row.number,
    name: row.name,
    description: row.description,
    rarity: row.rarity,
    imageUrl: row.imageUrl,
    holoMapUrl: row.holoMapUrl,
    holographic: false,
    signed: row.signed,
    tags: parseGameTags(row.tags),
    basePoints: row.basePoints,
    effectKind: parseEffectKind(row.effectKind),
    effectTag: parseEffectTag(row.effectTag),
    effectValue: row.effectValue,
    effectThreshold: row.effectThreshold,
    backImageUrl: row.backImageUrl,
  };
}

function pickShadeLineup(catalog: LineupSnapshotCard[]) {
  if (catalog.length < DECK_SIZE) {
    throw new MatchError("Not enough relics in the catalog");
  }
  const step = Math.max(1, Math.floor(catalog.length / DECK_SIZE));
  const picked: LineupSnapshotCard[] = [];
  const used = new Set<string>();
  for (let i = 0; i < DECK_SIZE; i += 1) {
    const start = (i * step) % catalog.length;
    let card = catalog[start];
    let offset = 0;
    while (card && used.has(card.cardId) && offset < catalog.length) {
      offset += 1;
      card = catalog[(start + offset) % catalog.length];
    }
    if (!card || used.has(card.cardId)) {
      throw new MatchError("Not enough relics in the catalog");
    }
    used.add(card.cardId);
    picked.push(card);
  }
  return picked;
}

async function loadShadeLineup(): Promise<LineupSnapshotCard[]> {
  const rows = await getDb()
    .select({
      cardId: cards.id,
      number: cards.number,
      name: cards.name,
      description: cards.description,
      rarity: cards.rarity,
      imageUrl: cards.imageUrl,
      holoMapUrl: cards.holoMapUrl,
      signed: cards.signed,
      tags: cards.tags,
      basePoints: cards.basePoints,
      effectKind: cards.effectKind,
      effectTag: cards.effectTag,
      effectValue: cards.effectValue,
      effectThreshold: cards.effectThreshold,
      backImageUrl: collections.backImageUrl,
    })
    .from(cards)
    .innerJoin(collections, eq(cards.collectionId, collections.id))
    .where(and(liveCms(cards), eq(cards.signed, false)))
    .orderBy(asc(cards.number));
  const unsigned = rows.map(shadeFromCatalogRow);
  if (unsigned.length >= DECK_SIZE) return pickShadeLineup(unsigned);
  const allRows = await getDb()
    .select({
      cardId: cards.id,
      number: cards.number,
      name: cards.name,
      description: cards.description,
      rarity: cards.rarity,
      imageUrl: cards.imageUrl,
      holoMapUrl: cards.holoMapUrl,
      signed: cards.signed,
      tags: cards.tags,
      basePoints: cards.basePoints,
      effectKind: cards.effectKind,
      effectTag: cards.effectTag,
      effectValue: cards.effectValue,
      effectThreshold: cards.effectThreshold,
      backImageUrl: collections.backImageUrl,
    })
    .from(cards)
    .innerJoin(collections, eq(cards.collectionId, collections.id))
    .where(liveCms(cards))
    .orderBy(asc(cards.number));
  return pickShadeLineup(allRows.map(shadeFromCatalogRow));
}

async function requireActiveLineup(userId: string) {
  const lineup = await getActiveLineup(userId);
  if (!lineup) throw new MatchError("Mark a six-relic lineup for queue first");
  return lineup;
}

async function requireUserRow(userId: string) {
  const [user] = await getDb()
    .select({
      id: users.id,
      name: users.name,
      rating: users.rating,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new MatchError("Player not found");
  return user;
}

export async function findOpenRankedMatch(userId: string) {
  const [row] = await getDb()
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.kind, "ranked"),
        eq(matches.status, "revealing"),
        or(eq(matches.playerAId, userId), eq(matches.playerBId, userId)),
      ),
    )
    .orderBy(asc(matches.createdAt))
    .limit(1);
  return row ? asRecord(row) : null;
}

async function insertMatch(input: {
  kind: MatchKind;
  playerAId: string;
  playerBId: string | null;
  playerAName: string;
  playerBName: string;
  playerARating: number;
  playerBRating: number;
  playerALineup: LineupSnapshotCard[];
  playerBLineup: LineupSnapshotCard[];
}) {
  const [created] = await getDb()
    .insert(matches)
    .values({
      kind: input.kind,
      status: "revealing",
      revealedCount: 0,
      playerAId: input.playerAId,
      playerBId: input.playerBId,
      playerAName: input.playerAName,
      playerBName: input.playerBName,
      playerARating: input.playerARating,
      playerBRating: input.playerBRating,
      playerALineup: input.playerALineup,
      playerBLineup: input.playerBLineup,
    })
    .returning();
  if (!created) throw new MatchError("Duel not found");
  return asRecord(created);
}

export async function startPracticeMatch(userId: string) {
  const [player, lineup, shade] = await Promise.all([
    requireUserRow(userId),
    requireActiveLineup(userId),
    loadShadeLineup(),
  ]);
  return insertMatch({
    kind: "practice",
    playerAId: player.id,
    playerBId: null,
    playerAName: player.name,
    playerBName: PRACTICE_OPPONENT_NAME,
    playerARating: player.rating,
    playerBRating: STARTING_RATING,
    playerALineup: lineup,
    playerBLineup: shade,
  });
}

export async function startRankedMatch(userId: string, opponentId?: string) {
  const open = await findOpenRankedMatch(userId);
  if (open) return open;

  const player = await requireUserRow(userId);
  const lineup = await requireActiveLineup(userId);
  const ready = await listQueueReadyPlayers(userId);
  const opponent = opponentId
    ? ready.find((row) => row.id === opponentId) ?? null
    : pickClosestOpponent(userId, player.rating, ready);
  if (!opponent) {
    throw new MatchError("No opponent with a queue-ready lineup");
  }
  const opponentLineup = await getActiveLineup(opponent.id);
  if (!opponentLineup) {
    throw new MatchError("No opponent with a queue-ready lineup");
  }
  const opponentUser = await requireUserRow(opponent.id);
  return insertMatch({
    kind: "ranked",
    playerAId: player.id,
    playerBId: opponentUser.id,
    playerAName: player.name,
    playerBName: opponentUser.name,
    playerARating: player.rating,
    playerBRating: opponentUser.rating,
    playerALineup: lineup,
    playerBLineup: opponentLineup,
  });
}

export async function getMatchRecord(matchId: string) {
  const [row] = await getDb()
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  return row ? asRecord(row) : null;
}

export async function getMatchPayload(
  matchId: string,
  viewer: MatchViewer,
): Promise<MatchPayload | null> {
  const match = await getMatchRecord(matchId);
  if (!match || !canViewMatch(match, viewer)) return null;
  return buildMatchPayload(match, viewer);
}

async function finishIfComplete(match: MatchRecord) {
  if (match.status === "finished" || match.revealedCount < DECK_SIZE) {
    return match;
  }
  const scoreA = scoreLineup(
    snapshotToPlayCards(match.playerALineup),
    DECK_SIZE,
  ).total;
  const scoreB = scoreLineup(
    snapshotToPlayCards(match.playerBLineup),
    DECK_SIZE,
  ).total;
  const winnerSide = winnerFromScores(scoreA, scoreB);
  const ranked = match.kind === "ranked" && match.playerBId;
  const deltas = ranked
    ? ratingPair(match.playerARating, match.playerBRating, winnerSide)
    : { deltaA: 0, deltaB: 0 };

  await getDb().transaction(async (tx) => {
    await tx
      .update(matches)
      .set({
        status: "finished",
        winnerSide,
        ratingDeltaA: ranked ? deltas.deltaA : null,
        ratingDeltaB: ranked ? deltas.deltaB : null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(matches.id, match.id));
    if (ranked && match.playerBId) {
      await tx
        .update(users)
        .set({
          rating: sql`${users.rating} + ${deltas.deltaA}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, match.playerAId));
      await tx
        .update(users)
        .set({
          rating: sql`${users.rating} + ${deltas.deltaB}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, match.playerBId));
    }
  });

  const updated = await getMatchRecord(match.id);
  if (!updated) throw new MatchError("Duel not found");
  return updated;
}

async function setRevealedCount(match: MatchRecord, revealedCount: number) {
  const next = Math.max(0, Math.min(DECK_SIZE, revealedCount));
  if (match.status === "finished" && next < DECK_SIZE) {
    await undoFinish(match);
  }
  await getDb()
    .update(matches)
    .set({
      revealedCount: next,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, match.id));
  const updated = await getMatchRecord(match.id);
  if (!updated) throw new MatchError("Duel not found");
  if (updated.status === "revealing" && updated.revealedCount >= DECK_SIZE) {
    return finishIfComplete(updated);
  }
  return updated;
}

async function undoFinish(match: MatchRecord) {
  if (match.status !== "finished") return;
  await getDb().transaction(async (tx) => {
    if (
      match.kind === "ranked" &&
      match.playerBId &&
      match.ratingDeltaA != null &&
      match.ratingDeltaB != null
    ) {
      await tx
        .update(users)
        .set({
          rating: sql`${users.rating} - ${match.ratingDeltaA}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, match.playerAId));
      await tx
        .update(users)
        .set({
          rating: sql`${users.rating} - ${match.ratingDeltaB}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, match.playerBId));
    }
    await tx
      .update(matches)
      .set({
        status: "revealing",
        winnerSide: null,
        ratingDeltaA: null,
        ratingDeltaB: null,
        finishedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, match.id));
  });
}

function requireControl(
  match: MatchRecord,
  viewer: MatchViewer,
  kind: "reveal" | "dev",
) {
  if (!canViewMatch(match, viewer)) throw new MatchError("Duel not found");
  if (kind === "reveal" && !canRevealMatch(match, viewer) && match.status === "revealing") {
    throw new MatchError("You cannot reveal this duel");
  }
  if (kind === "dev" && !canDevControlMatch(match, viewer)) {
    throw new MatchError("Dev controls are locked on this duel");
  }
}

export async function revealNext(matchId: string, viewer: MatchViewer) {
  const match = await getMatchRecord(matchId);
  if (!match) throw new MatchError("Duel not found");
  requireControl(match, viewer, "reveal");
  if (match.status === "finished") return match;
  if (!canRevealMatch(match, viewer)) {
    throw new MatchError("You cannot reveal this duel");
  }
  return setRevealedCount(match, match.revealedCount + 1);
}

export async function revealAll(matchId: string, viewer: MatchViewer) {
  const match = await getMatchRecord(matchId);
  if (!match) throw new MatchError("Duel not found");
  requireControl(match, viewer, "dev");
  if (match.status === "finished") return match;
  return setRevealedCount(match, DECK_SIZE);
}

export async function rewindReveal(matchId: string, viewer: MatchViewer) {
  const match = await getMatchRecord(matchId);
  if (!match) throw new MatchError("Duel not found");
  requireControl(match, viewer, "dev");
  if (match.revealedCount <= 0 && match.status === "revealing") return match;
  return setRevealedCount(match, match.revealedCount - 1);
}

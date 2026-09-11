import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, collections, deckCards, decks, userCards, users } from "@/db/schema";
import { liveCms } from "@/lib/cms/live";
import { DECK_SIZE, MAX_DECKS } from "@/lib/game/types";
import {
  parseEffectKind,
  parseEffectTag,
  parseGameTags,
  type DeckSummary,
  type LineupSnapshotCard,
  type OwnedDeckCard,
} from "@/lib/game/play-card";

export class DeckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckError";
  }
}

function emptySlots(): (string | null)[] {
  return Array.from({ length: DECK_SIZE }, () => null);
}

function asOwned(row: {
  cardId: string;
  number: number;
  name: string;
  description: string;
  rarity: OwnedDeckCard["rarity"];
  imageUrl: string | null;
  holoMapUrl: string | null;
  holographic: boolean;
  signed: boolean;
  tags: string[] | null;
  basePoints: number;
  effectKind: string | null;
  effectTag: string | null;
  effectValue: number | null;
  effectThreshold: number | null;
}): OwnedDeckCard {
  return {
    cardId: row.cardId,
    number: row.number,
    name: row.name,
    description: row.description,
    rarity: row.rarity,
    imageUrl: row.imageUrl,
    holoMapUrl: row.holoMapUrl,
    holographic: row.holographic,
    signed: row.signed,
    tags: parseGameTags(row.tags),
    basePoints: row.basePoints,
    effectKind: parseEffectKind(row.effectKind),
    effectTag: parseEffectTag(row.effectTag),
    effectValue: row.effectValue,
    effectThreshold: row.effectThreshold,
  };
}

const lineupSelect = {
  cardId: cards.id,
  number: cards.number,
  name: cards.name,
  description: cards.description,
  rarity: cards.rarity,
  imageUrl: cards.imageUrl,
  holoMapUrl: cards.holoMapUrl,
  holographic: userCards.holographic,
  signed: cards.signed,
  tags: cards.tags,
  basePoints: cards.basePoints,
  effectKind: cards.effectKind,
  effectTag: cards.effectTag,
  effectValue: cards.effectValue,
  effectThreshold: cards.effectThreshold,
  backImageUrl: collections.backImageUrl,
  slot: deckCards.slot,
};

export async function getActiveLineup(
  userId: string,
): Promise<LineupSnapshotCard[] | null> {
  const rows = await getDb()
    .select(lineupSelect)
    .from(decks)
    .innerJoin(deckCards, eq(deckCards.deckId, decks.id))
    .innerJoin(cards, eq(deckCards.cardId, cards.id))
    .innerJoin(
      userCards,
      and(eq(userCards.userId, decks.userId), eq(userCards.cardId, cards.id)),
    )
    .innerJoin(collections, eq(cards.collectionId, collections.id))
    .where(
      and(eq(decks.userId, userId), eq(decks.isActive, true), liveCms(cards)),
    )
    .orderBy(asc(deckCards.slot));
  if (rows.length !== DECK_SIZE) return null;
  return rows.map((row) => ({
    ...asOwned(row),
    backImageUrl: row.backImageUrl,
  }));
}

export async function listQueueReadyPlayers(excludeUserId?: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      rating: users.rating,
      cardCount: sql<number>`count(${deckCards.id})::int`,
    })
    .from(users)
    .innerJoin(decks, and(eq(decks.userId, users.id), eq(decks.isActive, true)))
    .innerJoin(deckCards, eq(deckCards.deckId, decks.id))
    .innerJoin(cards, eq(deckCards.cardId, cards.id))
    .where(liveCms(cards))
    .groupBy(users.id, users.name, users.rating);
  return rows
    .filter((row) => Number(row.cardCount) === DECK_SIZE)
    .filter((row) => row.id !== excludeUserId)
    .map(({ id, name, rating }) => ({ id, name, rating }));
}

export async function listOwnedDeckCards(userId: string): Promise<OwnedDeckCard[]> {
  const rows = await getDb()
    .select({
      cardId: cards.id,
      number: cards.number,
      name: cards.name,
      description: cards.description,
      rarity: cards.rarity,
      imageUrl: cards.imageUrl,
      holoMapUrl: cards.holoMapUrl,
      holographic: userCards.holographic,
      signed: cards.signed,
      tags: cards.tags,
      basePoints: cards.basePoints,
      effectKind: cards.effectKind,
      effectTag: cards.effectTag,
      effectValue: cards.effectValue,
      effectThreshold: cards.effectThreshold,
    })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(and(eq(userCards.userId, userId), liveCms(cards)))
    .orderBy(asc(cards.number), asc(cards.signed));
  return rows.map(asOwned);
}

export async function listDecks(userId: string): Promise<DeckSummary[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(asc(decks.createdAt));
  if (rows.length === 0) return [];
  const placed = await db
    .select()
    .from(deckCards)
    .where(
      inArray(
        deckCards.deckId,
        rows.map((row) => row.id),
      ),
    );
  const byDeck = new Map<string, (string | null)[]>();
  for (const row of rows) byDeck.set(row.id, emptySlots());
  for (const place of placed) {
    const slots = byDeck.get(place.deckId);
    if (!slots) continue;
    if (place.slot >= 1 && place.slot <= DECK_SIZE) {
      slots[place.slot - 1] = place.cardId;
    }
  }
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    slots: byDeck.get(row.id) ?? emptySlots(),
  }));
}

export async function createDeck(userId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new DeckError("Name is required");
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(decks)
    .where(eq(decks.userId, userId));
  if (Number(count) >= MAX_DECKS) {
    throw new DeckError("You can keep at most 8 lineups");
  }
  const [created] = await db
    .insert(decks)
    .values({ userId, name: trimmed })
    .returning({ id: decks.id });
  return created.id;
}

export async function renameDeck(userId: string, deckId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new DeckError("Name is required");
  const updated = await getDb()
    .update(decks)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning({ id: decks.id });
  if (updated.length === 0) throw new DeckError("Lineup not found");
}

export async function deleteDeck(userId: string, deckId: string) {
  const removed = await getDb()
    .delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning({ id: decks.id });
  if (removed.length === 0) throw new DeckError("Lineup not found");
}

async function requireOwnedLiveCardIds(userId: string, cardIds: string[]) {
  if (cardIds.length === 0) return;
  const unique = [...new Set(cardIds)];
  const rows = await getDb()
    .select({ id: cards.id })
    .from(userCards)
    .innerJoin(cards, eq(userCards.cardId, cards.id))
    .where(
      and(
        eq(userCards.userId, userId),
        liveCms(cards),
        inArray(cards.id, unique),
      ),
    );
  if (rows.length !== unique.length) {
    throw new DeckError("You do not own that relic");
  }
}

export async function saveDeckSlots(
  userId: string,
  deckId: string,
  slots: (string | null)[],
) {
  if (slots.length !== DECK_SIZE) throw new DeckError("Invalid lineup");
  const filled = slots.filter((id): id is string => Boolean(id));
  if (new Set(filled).size !== filled.length) {
    throw new DeckError("That relic is already in this lineup");
  }
  const db = getDb();
  const [deck] = await db
    .select({ id: decks.id, isActive: decks.isActive })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);
  if (!deck) throw new DeckError("Lineup not found");
  await requireOwnedLiveCardIds(userId, filled);

  await db.transaction(async (tx) => {
    await tx.delete(deckCards).where(eq(deckCards.deckId, deckId));
    const rows = slots.flatMap((cardId, index) =>
      cardId
        ? [{ deckId, cardId, slot: index + 1 }]
        : [],
    );
    if (rows.length) await tx.insert(deckCards).values(rows);
    await tx
      .update(decks)
      .set({
        isActive: deck.isActive && filled.length === DECK_SIZE,
        updatedAt: new Date(),
      })
      .where(eq(decks.id, deckId));
  });
}

export async function setActiveDeck(userId: string, deckId: string) {
  const db = getDb();
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .limit(1);
  if (!deck) throw new DeckError("Lineup not found");
  const placed = await db
    .select({ cardId: deckCards.cardId })
    .from(deckCards)
    .where(eq(deckCards.deckId, deckId));
  if (placed.length !== DECK_SIZE) {
    throw new DeckError("A queue lineup needs six relics");
  }
  await requireOwnedLiveCardIds(
    userId,
    placed.map((row) => row.cardId),
  );

  await db.transaction(async (tx) => {
    await tx
      .update(decks)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(decks.userId, userId));
    await tx
      .update(decks)
      .set({ isActive: true, updatedAt: new Date() })
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)));
  });
}

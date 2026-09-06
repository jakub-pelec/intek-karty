import { and, eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { liveCms } from "@/lib/cms/live";
import {
  achievements,
  cards,
  collections,
  draws,
  pointsLedger,
  userAchievements,
  userCards,
  users,
  type AchievementCondition,
  type LedgerSource,
  type Rarity,
} from "@/db/schema";
import { achievementSpec } from "@/lib/achievements/spec";
import { TOTAL_CARDS } from "@/lib/constants";

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type AchievementUnlock = {
  id: string;
  name: string;
  pointReward: number;
};

export type AchievementEvalState = {
  drawCount: number;
  ownedCount: number;
  ownedRarities: Rarity[];
  catalogCount?: number;
  completedACollection?: boolean;
  holoCount?: number;
  signedCount?: number;
  signedHoloCount?: number;
  signedHoloLegendaryCount?: number;
  collectionOwned?: Record<string, number>;
  collectionNeeded?: Record<string, number>;
  collectionHoloOwned?: Record<string, number>;
  bestCollection?: { owned: number; needed: number };
};

export type AchievementProgress = {
  current: number;
  required: number;
};

type OwnedEvalCard = {
  cardId: string;
  rarity: Rarity;
  collectionId: string;
  collectionSlug: string;
  signed: boolean;
  holographic: boolean;
};

type CatalogEvalCard = {
  id: string;
  collectionId: string;
  collectionSlug: string;
  collectionName: string;
};

export function achievementConditionMet(
  type: AchievementCondition,
  threshold: number | null,
  state: AchievementEvalState,
  collectionSlug?: string | null,
) {
  const rarities = new Set(state.ownedRarities);
  const needed = collectionSlug
    ? (state.collectionNeeded?.[collectionSlug] ?? 0)
    : 0;
  const ownedInSet = collectionSlug
    ? (state.collectionOwned?.[collectionSlug] ?? 0)
    : 0;
  const holoInSet = collectionSlug
    ? (state.collectionHoloOwned?.[collectionSlug] ?? 0)
    : 0;

  switch (type) {
    case "first_booster":
      return state.drawCount >= 1;
    case "first_epic":
      return rarities.has("epic");
    case "first_legendary":
      return rarities.has("legendary");
    case "first_joker":
      return rarities.has("joker");
    case "cards_collected_threshold":
      return state.ownedCount >= (threshold ?? 0);
    case "full_collection":
      if (threshold !== null) return state.ownedCount >= threshold;
      if (state.completedACollection !== undefined) return state.completedACollection;
      return state.ownedCount >= (state.catalogCount ?? TOTAL_CARDS);
    case "holo_collected_threshold":
      return (state.holoCount ?? 0) >= (threshold ?? 0);
    case "signed_collected_threshold":
      return (state.signedCount ?? 0) >= (threshold ?? 0);
    case "signed_holo_collected_threshold":
      return (state.signedHoloCount ?? 0) >= (threshold ?? 0);
    case "signed_holo_legendary_threshold":
      return (state.signedHoloLegendaryCount ?? 0) >= (threshold ?? 0);
    case "collection_first_card":
      return Boolean(collectionSlug) && ownedInSet >= (threshold ?? 1);
    case "collection_complete":
      return Boolean(collectionSlug) && needed > 0 && ownedInSet >= needed;
    case "collection_holo_complete":
      return Boolean(collectionSlug) && needed > 0 && holoInSet >= needed;
    default:
      return false;
  }
}

export function achievementProgress(
  type: AchievementCondition,
  threshold: number | null,
  state: AchievementEvalState,
  collectionSlug?: string | null,
): AchievementProgress {
  const rarities = new Set(state.ownedRarities);
  const needed = collectionSlug
    ? (state.collectionNeeded?.[collectionSlug] ?? 0)
    : 0;
  const ownedInSet = collectionSlug
    ? (state.collectionOwned?.[collectionSlug] ?? 0)
    : 0;
  const holoInSet = collectionSlug
    ? (state.collectionHoloOwned?.[collectionSlug] ?? 0)
    : 0;

  switch (type) {
    case "first_booster":
      return { current: Math.min(state.drawCount, 1), required: 1 };
    case "first_epic":
      return { current: rarities.has("epic") ? 1 : 0, required: 1 };
    case "first_legendary":
      return { current: rarities.has("legendary") ? 1 : 0, required: 1 };
    case "first_joker":
      return { current: rarities.has("joker") ? 1 : 0, required: 1 };
    case "cards_collected_threshold":
      return { current: state.ownedCount, required: threshold ?? 0 };
    case "full_collection":
      if (threshold !== null) return { current: state.ownedCount, required: threshold };
      if (state.bestCollection && state.bestCollection.needed > 0) {
        return {
          current: state.bestCollection.owned,
          required: state.bestCollection.needed,
        };
      }
      return {
        current: state.ownedCount,
        required: state.catalogCount ?? TOTAL_CARDS,
      };
    case "holo_collected_threshold":
      return { current: state.holoCount ?? 0, required: threshold ?? 0 };
    case "signed_collected_threshold":
      return { current: state.signedCount ?? 0, required: threshold ?? 0 };
    case "signed_holo_collected_threshold":
      return { current: state.signedHoloCount ?? 0, required: threshold ?? 0 };
    case "signed_holo_legendary_threshold":
      return { current: state.signedHoloLegendaryCount ?? 0, required: threshold ?? 0 };
    case "collection_first_card":
      return { current: ownedInSet, required: threshold ?? 1 };
    case "collection_complete":
      return { current: ownedInSet, required: needed };
    case "collection_holo_complete":
      return { current: holoInSet, required: needed };
    default:
      return { current: 0, required: 0 };
  }
}

export function buildAchievementEvalState(
  owned: OwnedEvalCard[],
  drawCount: number,
  activeCatalog: CatalogEvalCard[],
) {
  const ownedIds = new Set(owned.map((row) => row.cardId));
  const neededByCollection = new Map<string, number>();
  const ownedByCollection = new Map<string, number>();
  const collectionNeeded: Record<string, number> = {};
  const collectionOwned: Record<string, number> = {};
  const collectionHoloOwned: Record<string, number> = {};

  for (const card of activeCatalog) {
    neededByCollection.set(
      card.collectionId,
      (neededByCollection.get(card.collectionId) ?? 0) + 1,
    );
    collectionNeeded[card.collectionSlug] =
      (collectionNeeded[card.collectionSlug] ?? 0) + 1;
    if (ownedIds.has(card.id)) {
      ownedByCollection.set(
        card.collectionId,
        (ownedByCollection.get(card.collectionId) ?? 0) + 1,
      );
    }
  }

  for (const row of owned) {
    collectionOwned[row.collectionSlug] =
      (collectionOwned[row.collectionSlug] ?? 0) + 1;
    if (row.holographic) {
      collectionHoloOwned[row.collectionSlug] =
        (collectionHoloOwned[row.collectionSlug] ?? 0) + 1;
    }
  }

  const completedACollection = [...neededByCollection.entries()].some(
    ([collectionId, needed]) =>
      needed > 0 && (ownedByCollection.get(collectionId) ?? 0) >= needed,
  );

  let bestCollection = { owned: 0, needed: 0 };
  for (const [collectionId, needed] of neededByCollection) {
    if (needed <= 0) continue;
    const have = ownedByCollection.get(collectionId) ?? 0;
    const bestRatio =
      bestCollection.needed > 0 ? bestCollection.owned / bestCollection.needed : -1;
    const ratio = have / needed;
    if (ratio > bestRatio || (ratio === bestRatio && needed > bestCollection.needed)) {
      bestCollection = { owned: have, needed };
    }
  }

  const state: AchievementEvalState = {
    drawCount,
    ownedCount: owned.length,
    ownedRarities: owned.map((row) => row.rarity),
    catalogCount: activeCatalog.length,
    completedACollection,
    holoCount: owned.filter((row) => row.holographic).length,
    signedCount: owned.filter((row) => row.signed).length,
    signedHoloCount: owned.filter((row) => row.signed && row.holographic).length,
    signedHoloLegendaryCount: owned.filter(
      (row) => row.signed && row.holographic && row.rarity === "legendary",
    ).length,
    collectionOwned,
    collectionNeeded,
    collectionHoloOwned,
    bestCollection,
  };

  const collectionMeta = [
    ...new Map(
      activeCatalog.map((row) => [
        row.collectionSlug,
        { slug: row.collectionSlug, name: row.collectionName },
      ]),
    ).values(),
  ];

  return { state, collectionMeta };
}

export async function creditPoints(
  tx: Tx,
  input: {
    userId: string;
    amount: number;
    source: LedgerSource;
    refId?: string | null;
    note?: string | null;
    createdBy?: string | null;
  },
) {
  await tx.insert(pointsLedger).values({
    userId: input.userId,
    amount: input.amount,
    source: input.source,
    refId: input.refId ?? null,
    note: input.note ?? null,
    createdBy: input.createdBy ?? null,
  });
  await tx
    .update(users)
    .set({
      pointsBalance: sql`${users.pointsBalance} + ${input.amount}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));
}

export async function evaluateAchievements(
  tx: Tx,
  userId: string,
): Promise<AchievementUnlock[]> {
  const [owned, drawCountRow, catalog, already, activeCatalog] = await Promise.all([
    tx
      .select({
        cardId: cards.id,
        rarity: cards.rarity,
        collectionId: cards.collectionId,
        collectionSlug: collections.slug,
        signed: cards.signed,
        holographic: userCards.holographic,
      })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(and(eq(userCards.userId, userId), liveCms(cards), liveCms(collections))),
    tx
      .select({ count: sql<number>`count(*)::int` })
      .from(draws)
      .where(eq(draws.userId, userId)),
    tx.select().from(achievements).where(liveCms(achievements)),
    tx
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId)),
    tx
      .select({
        id: cards.id,
        collectionId: cards.collectionId,
        collectionSlug: collections.slug,
        collectionName: collections.name,
      })
      .from(cards)
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(and(liveCms(cards), liveCms(collections))),
  ]);

  const { state, collectionMeta } = buildAchievementEvalState(
    owned,
    Number(drawCountRow[0]?.count ?? 0),
    activeCatalog,
  );
  const unlockedIds = new Set(already.map((row) => row.achievementId));
  const newlyUnlocked: AchievementUnlock[] = [];

  for (const achievement of catalog) {
    if (unlockedIds.has(achievement.id)) continue;
    const spec = achievementSpec(achievement, collectionMeta);
    if (
      !achievementConditionMet(
        spec.conditionType,
        spec.threshold,
        state,
        spec.collectionSlug,
      )
    ) {
      continue;
    }

    const inserted = await tx
      .insert(userAchievements)
      .values({ userId, achievementId: achievement.id })
      .onConflictDoNothing()
      .returning({ id: userAchievements.id });

    if (inserted.length === 0) continue;

    if (achievement.pointReward > 0) {
      await creditPoints(tx, {
        userId,
        amount: achievement.pointReward,
        source: "achievement",
        refId: achievement.id,
        note: `Achievement: ${achievement.name}`,
      });
    }

    newlyUnlocked.push({
      id: achievement.id,
      name: achievement.name,
      pointReward: achievement.pointReward,
    });
  }

  return newlyUnlocked;
}

export async function evaluateAchievementsForUser(userId: string) {
  return getDb().transaction((tx) => evaluateAchievements(tx, userId));
}

export async function loadAchievementEvalState(userId: string) {
  const db = getDb();
  const [owned, drawCountRow, activeCatalog] = await Promise.all([
    db
      .select({
        cardId: cards.id,
        rarity: cards.rarity,
        collectionId: cards.collectionId,
        collectionSlug: collections.slug,
        signed: cards.signed,
        holographic: userCards.holographic,
      })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(and(eq(userCards.userId, userId), liveCms(cards), liveCms(collections))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(draws)
      .where(eq(draws.userId, userId)),
    db
      .select({
        id: cards.id,
        collectionId: cards.collectionId,
        collectionSlug: collections.slug,
        collectionName: collections.name,
      })
      .from(cards)
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(and(liveCms(cards), liveCms(collections))),
  ]);

  return buildAchievementEvalState(
    owned,
    Number(drawCountRow[0]?.count ?? 0),
    activeCatalog,
  );
}

export async function ownedCardIdSet(tx: Tx, userId: string) {
  const rows = await tx
    .select({ cardId: userCards.cardId })
    .from(userCards)
    .where(eq(userCards.userId, userId));
  return new Set(rows.map((row) => row.cardId));
}

export async function activeCardsOfRarity(
  tx: Tx,
  rarity: Rarity,
  signed = false,
  collectionId: string,
) {
  return tx
    .select()
    .from(cards)
    .where(
      and(
        liveCms(cards),
        eq(cards.rarity, rarity),
        eq(cards.signed, signed),
        eq(cards.collectionId, collectionId),
      ),
    );
}

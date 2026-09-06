import { and, eq, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import { liveCms } from "@/lib/cms/live";
import {
  achievements,
  cards,
  draws,
  pointsLedger,
  userAchievements,
  userCards,
  users,
  type AchievementCondition,
  type LedgerSource,
  type Rarity,
} from "@/db/schema";
import { TOTAL_CARDS } from "@/lib/constants";

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type AchievementUnlock = {
  id: string;
  name: string;
  pointReward: number;
};

export function achievementConditionMet(
  type: AchievementCondition,
  threshold: number | null,
  state: {
    drawCount: number;
    ownedCount: number;
    ownedRarities: Rarity[];
    catalogCount?: number;
    completedACollection?: boolean;
  },
) {
  const rarities = new Set(state.ownedRarities);
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
    default:
      return false;
  }
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
      })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(and(eq(userCards.userId, userId), liveCms(cards))),
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
      })
      .from(cards)
      .where(liveCms(cards)),
  ]);

  const ownedIds = new Set(owned.map((row) => row.cardId));
  const neededByCollection = new Map<string, number>();
  const ownedByCollection = new Map<string, number>();
  for (const card of activeCatalog) {
    neededByCollection.set(
      card.collectionId,
      (neededByCollection.get(card.collectionId) ?? 0) + 1,
    );
    if (ownedIds.has(card.id)) {
      ownedByCollection.set(
        card.collectionId,
        (ownedByCollection.get(card.collectionId) ?? 0) + 1,
      );
    }
  }
  const completedACollection = [...neededByCollection.entries()].some(
    ([collectionId, needed]) =>
      needed > 0 && (ownedByCollection.get(collectionId) ?? 0) >= needed,
  );

  const unlockedIds = new Set(already.map((row) => row.achievementId));
  const state = {
    drawCount: Number(drawCountRow[0]?.count ?? 0),
    ownedCount: owned.length,
    ownedRarities: owned.map((row) => row.rarity),
    catalogCount: activeCatalog.length,
    completedACollection,
  };

  const newlyUnlocked: AchievementUnlock[] = [];

  for (const achievement of catalog) {
    if (unlockedIds.has(achievement.id)) continue;
    if (
      !achievementConditionMet(
        achievement.conditionType,
        achievement.threshold,
        state,
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

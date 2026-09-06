import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, collections, userCards } from "@/db/schema";

export async function listCollections() {
  return getDb()
    .select()
    .from(collections)
    .orderBy(asc(collections.sortOrder), asc(collections.name));
}

export async function listActiveCollections() {
  return getDb()
    .select()
    .from(collections)
    .where(eq(collections.active, true))
    .orderBy(asc(collections.sortOrder), asc(collections.name));
}

export async function collectionProgress(userId: string, collectionId: string) {
  const db = getDb();
  const [[totalRow], [ownedRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cards)
      .where(and(eq(cards.collectionId, collectionId), eq(cards.active, true))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(
        and(
          eq(userCards.userId, userId),
          eq(cards.collectionId, collectionId),
          eq(cards.active, true),
        ),
      ),
  ]);
  return {
    owned: Number(ownedRow?.count ?? 0),
    total: Number(totalRow?.count ?? 0),
  };
}

export async function activeCardCount(collectionId: string) {
  const [row] = await getDb()
    .select({ count: sql<number>`count(*)::int` })
    .from(cards)
    .where(and(eq(cards.collectionId, collectionId), eq(cards.active, true)));
  return Number(row?.count ?? 0);
}

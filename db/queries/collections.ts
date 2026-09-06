import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, collections, userCards } from "@/db/schema";
import { liveCms } from "@/lib/cms/live";

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
    .where(liveCms(collections))
    .orderBy(asc(collections.sortOrder), asc(collections.name));
}

export async function collectionProgress(userId: string, collectionId: string) {
  const db = getDb();
  const [[totalRow], [ownedRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(cards)
      .where(and(eq(cards.collectionId, collectionId), liveCms(cards))),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userCards)
      .innerJoin(cards, eq(userCards.cardId, cards.id))
      .where(
        and(
          eq(userCards.userId, userId),
          eq(cards.collectionId, collectionId),
          liveCms(cards),
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
    .where(and(eq(cards.collectionId, collectionId), liveCms(cards)));
  return Number(row?.count ?? 0);
}

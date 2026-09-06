import { and, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, draws, userBoosters, userCards, users } from "@/db/schema";
import { creditPoints, evaluateAchievements } from "@/db/queries/achievements";

export class AdminActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminActionError";
  }
}

function requireReason(reason: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new AdminActionError("A reason is required");
  return trimmed;
}

export async function searchUsers(query: string) {
  const db = getDb();
  const term = `%${query.trim()}%`;
  return db
    .select()
    .from(users)
    .where(or(ilike(users.name, term), ilike(users.twitchId, term)))
    .limit(25);
}

export async function grantCard(input: {
  userId: string;
  cardId: string;
  adminId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [card] = await tx
      .select()
      .from(cards)
      .where(eq(cards.id, input.cardId))
      .limit(1);
    if (!card) throw new AdminActionError("Card not found");

    const inserted = await tx
      .insert(userCards)
      .values({ userId: input.userId, cardId: card.id })
      .onConflictDoNothing()
      .returning();

    if (inserted.length === 0) {
      throw new AdminActionError("User already owns this card");
    }

    const [viewer] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    const [draw] = await tx
      .insert(draws)
      .values({
        userId: input.userId,
        cardId: card.id,
        isDuplicate: false,
        pointsAwarded: 0,
        triggeredBy: input.adminId,
        note: `Manual grant: ${reason}`,
        viewerName: viewer?.name ?? "Viewer",
        cardName: card.name,
        cardNumber: card.number,
        cardRarity: card.rarity,
        cardImageUrl: card.imageUrl,
      })
      .returning();

    await tx
      .update(userCards)
      .set({ drawId: draw.id })
      .where(eq(userCards.id, inserted[0].id));

    const unlocked = await evaluateAchievements(tx, input.userId);
    return { card, draw, achievements: unlocked };
  });
}

export async function revokeCard(input: {
  userId: string;
  cardId: string;
  reason: string;
}) {
  requireReason(input.reason);
  const db = getDb();
  const deleted = await db
    .delete(userCards)
    .where(
      and(eq(userCards.userId, input.userId), eq(userCards.cardId, input.cardId)),
    )
    .returning();

  if (deleted.length === 0) {
    throw new AdminActionError("User does not own this card");
  }
  return deleted[0];
}

export async function adjustPoints(input: {
  userId: string;
  amount: number;
  adminId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  if (!Number.isInteger(input.amount) || input.amount === 0) {
    throw new AdminActionError("Amount must be a non-zero integer");
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    await creditPoints(tx, {
      userId: input.userId,
      amount: input.amount,
      source: "admin_adjust",
      note: reason,
      createdBy: input.adminId,
    });
  });
}

export async function addBoosterToUser(input: {
  userId: string;
  boosterTypeId: string;
  reason: string;
}) {
  const reason = requireReason(input.reason);
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!user) throw new AdminActionError("User not found");

  const [row] = await db
    .insert(userBoosters)
    .values({
      twitchId: user.twitchId,
      userId: user.id,
      boosterTypeId: input.boosterTypeId,
      status: "pending",
      note: `Manual add: ${reason}`,
    })
    .returning();
  return row;
}

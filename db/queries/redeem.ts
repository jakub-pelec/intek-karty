import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { pointsLedger, rewards, shopRedemptions, users } from "@/db/schema";

export class RedeemError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedeemError";
  }
}

export async function redeemReward(input: {
  userId: string;
  rewardId: string;
}) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [reward] = await tx
      .select()
      .from(rewards)
      .where(eq(rewards.id, input.rewardId))
      .limit(1);

    if (!reward || !reward.active || !reward.cmsId) {
      throw new RedeemError("Reward is not available");
    }

    if (reward.stock !== null) {
      const decremented = await tx
        .update(rewards)
        .set({
          stock: sql`${rewards.stock} - 1`,
          updatedAt: new Date(),
        })
        .where(and(eq(rewards.id, reward.id), sql`${rewards.stock} > 0`))
        .returning({ id: rewards.id });
      if (decremented.length === 0) {
        throw new RedeemError("This reward is sold out");
      }
    }

    const deducted = await tx
      .update(users)
      .set({
        pointsBalance: sql`${users.pointsBalance} - ${reward.pointCost}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(users.id, input.userId),
          sql`${users.pointsBalance} >= ${reward.pointCost}`,
        ),
      )
      .returning({ id: users.id });

    if (deducted.length === 0) {
      throw new RedeemError("Not enough collector points");
    }

    const [redemption] = await tx
      .insert(shopRedemptions)
      .values({
        userId: input.userId,
        rewardId: reward.id,
        pointsSpent: reward.pointCost,
      })
      .returning();

    await tx.insert(pointsLedger).values({
      userId: input.userId,
      amount: -reward.pointCost,
      source: "shop_redeem",
      refId: redemption.id,
      note: `Redeemed ${reward.name}`,
    });

    return redemption;
  });
}

export async function reconcilePoints(userId: string) {
  const db = getDb();
  const [user] = await db
    .select({ pointsBalance: users.pointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const [sum] = await db
    .select({
      total: sql<number>`coalesce(sum(${pointsLedger.amount}), 0)::int`,
    })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId));
  return {
    balance: user?.pointsBalance ?? 0,
    ledgerSum: Number(sum?.total ?? 0),
  };
}

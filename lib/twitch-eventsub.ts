import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { boosterTypes, userBoosters, users } from "@/db/schema";
import { attachPendingBoosters } from "@/db/queries/users";

const MAX_MESSAGE_AGE_MS = 10 * 60 * 1000;

export function verifyTwitchMessage(input: {
  secret: string;
  messageId: string;
  timestamp: string;
  body: string;
  signature: string;
}) {
  const expected =
    "sha256=" +
    createHmac("sha256", input.secret)
      .update(input.messageId + input.timestamp + input.body)
      .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function isTwitchTimestampFresh(timestamp: string, now = Date.now()) {
  const ts = Date.parse(timestamp);
  if (Number.isNaN(ts)) return false;
  return Math.abs(now - ts) <= MAX_MESSAGE_AGE_MS;
}

export type ChannelPointsRedemption = {
  id: string;
  reward: { id: string; title?: string };
  user_id: string;
  user_name?: string;
  user_login?: string;
};

export async function ingestChannelPointsRedemption(
  redemption: ChannelPointsRedemption,
) {
  const db = getDb();
  const [boosterType] = await db
    .select()
    .from(boosterTypes)
    .where(eq(boosterTypes.twitchRewardId, redemption.reward.id))
    .limit(1);

  if (!boosterType || !boosterType.active || !boosterType.cmsId) {
    return { ignored: true as const, reason: "unknown_reward" };
  }

  const displayName =
    redemption.user_name || redemption.user_login || `twitch:${redemption.user_id}`;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.twitchId, redemption.user_id))
    .limit(1);

  let userId = existingUser?.id ?? null;
  if (!existingUser) {
    const [created] = await db
      .insert(users)
      .values({
        twitchId: redemption.user_id,
        name: displayName,
      })
      .onConflictDoNothing()
      .returning({ id: users.id });
    if (created) {
      userId = created.id;
    } else {
      const [again] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.twitchId, redemption.user_id))
        .limit(1);
      userId = again?.id ?? null;
    }
  } else if (existingUser.name.startsWith("twitch:")) {
    await db
      .update(users)
      .set({ name: displayName, updatedAt: new Date() })
      .where(eq(users.id, existingUser.id));
  }

  if (userId) {
    await attachPendingBoosters(userId, redemption.user_id);
  }

  const inserted = await db
    .insert(userBoosters)
    .values({
      twitchId: redemption.user_id,
      userId,
      boosterTypeId: boosterType.id,
      status: "pending",
      twitchRedemptionId: redemption.id,
    })
    .onConflictDoNothing()
    .returning({ id: userBoosters.id });

  return {
    ignored: false as const,
    created: inserted.length > 0,
    userBoosterId: inserted[0]?.id ?? null,
  };
}

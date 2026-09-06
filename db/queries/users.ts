import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userBoosters, users, type Role } from "@/db/schema";
import { parseAdminTwitchIds } from "@/lib/utils";

export type TwitchProfileInput = {
  twitchId: string;
  name: string;
  image?: string | null;
};

export async function upsertUserFromTwitch(profile: TwitchProfileInput) {
  const db = getDb();
  const adminIds = parseAdminTwitchIds();
  const shouldBeAdmin = adminIds.includes(profile.twitchId);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.twitchId, profile.twitchId))
    .limit(1);

  if (existing) {
    const role: Role =
      existing.role === "admin" || shouldBeAdmin ? "admin" : "viewer";
    const [updated] = await db
      .update(users)
      .set({
        name: profile.name,
        image: profile.image ?? existing.image,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    await attachPendingBoosters(updated.id, updated.twitchId);
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      twitchId: profile.twitchId,
      name: profile.name,
      image: profile.image ?? null,
      role: shouldBeAdmin ? "admin" : "viewer",
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    await attachPendingBoosters(created.id, created.twitchId);
    return created;
  }

  const [again] = await db
    .select()
    .from(users)
    .where(eq(users.twitchId, profile.twitchId))
    .limit(1);
  if (!again) throw new Error("Failed to upsert Twitch user");
  await attachPendingBoosters(again.id, again.twitchId);
  return again;
}

export async function attachPendingBoosters(userId: string, twitchId: string) {
  const db = getDb();
  await db
    .update(userBoosters)
    .set({ userId })
    .where(eq(userBoosters.twitchId, twitchId));
}

export async function getUserById(id: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByTwitchId(twitchId: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.twitchId, twitchId))
    .limit(1);
  return user ?? null;
}

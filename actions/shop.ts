"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { shopRedemptions } from "@/db/schema";
import { RedeemError, redeemReward } from "@/db/queries/redeem";
import { requireAdmin, requireUser } from "@/lib/rbac";
import { AuthError } from "@/lib/rbac";

export async function setRedemptionStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = z
    .enum(["fulfilled", "cancelled", "pending_fulfillment"])
    .safeParse(formData.get("status"));
  if (!id || !parsed.success) return { error: "Invalid fulfillment update" };

  await getDb()
    .update(shopRedemptions)
    .set({ status: parsed.data })
    .where(eq(shopRedemptions.id, id));
  revalidatePath("/admin/rewards");
  return { success: parsed.data === "fulfilled" ? "Marked fulfilled" : "Updated" };
}

export async function redeemRewardAction(rewardId: string) {
  try {
    const user = await requireUser();
    await redeemReward({ userId: user.id, rewardId });
    revalidatePath("/shop");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    return { success: "Reward redeemed. An admin will fulfill it out of band." };
  } catch (error) {
    if (error instanceof RedeemError || error instanceof AuthError) {
      return { error: error.message };
    }
    throw error;
  }
}

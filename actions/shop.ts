"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { shopRedemptions } from "@/db/schema";
import { RedeemError, redeemReward } from "@/db/queries/redeem";
import { requireAdmin, requireUser, AuthError } from "@/lib/rbac";
import { translateRedeemError } from "@/lib/i18n-errors";

export async function setRedemptionStatus(formData: FormData) {
  await requireAdmin();
  const t = await getTranslations("shopActions");
  const id = String(formData.get("id") ?? "");
  const parsed = z
    .enum(["fulfilled", "cancelled", "pending_fulfillment"])
    .safeParse(formData.get("status"));
  if (!id || !parsed.success) return { error: t("invalidFulfillment") };

  await getDb()
    .update(shopRedemptions)
    .set({ status: parsed.data })
    .where(eq(shopRedemptions.id, id));
  revalidatePath("/admin/rewards");
  return { success: parsed.data === "fulfilled" ? t("markedFulfilled") : t("updated") };
}

export async function redeemRewardAction(rewardId: string) {
  try {
    const user = await requireUser();
    await redeemReward({ userId: user.id, rewardId });
    revalidatePath("/shop");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    const t = await getTranslations("shopActions");
    return { success: t("redeemed") };
  } catch (error) {
    if (error instanceof RedeemError || error instanceof AuthError) {
      const t = await getTranslations("errors");
      return { error: translateRedeemError(t, error.message) };
    }
    throw error;
  }
}

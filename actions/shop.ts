"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { rewards } from "@/db/schema";
import { RedeemError, redeemReward } from "@/db/queries/redeem";
import { requireAdmin, requireUser } from "@/lib/rbac";
import { AuthError } from "@/lib/rbac";

export async function saveReward(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const parsed = z
    .object({
      name: z.string().trim().min(1),
      description: z.string().trim().min(1),
      pointCost: z.coerce.number().int().positive(),
      active: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      description: formData.get("description"),
      pointCost: formData.get("pointCost"),
      active: formData.get("active") === "on",
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid reward" };
  }

  const stock = stockRaw === "" ? null : Number(stockRaw);
  if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
    return { error: "Stock must be empty (unlimited) or a non-negative integer" };
  }

  const db = getDb();
  const values = {
    ...parsed.data,
    stock,
    active: parsed.data.active ?? true,
    updatedAt: new Date(),
  };
  if (id) {
    await db.update(rewards).set(values).where(eq(rewards.id, id));
  } else {
    await db.insert(rewards).values(values);
  }
  revalidatePath("/admin/rewards");
  revalidatePath("/shop");
  return { success: "Reward saved" };
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

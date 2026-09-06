"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { achievements, type AchievementCondition } from "@/db/schema";
import { requireAdmin } from "@/lib/rbac";

const conditionSchema = z.enum([
  "first_booster",
  "first_epic",
  "first_legendary",
  "first_joker",
  "cards_collected_threshold",
  "full_collection",
]);

export async function saveAchievement(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = z
    .object({
      name: z.string().trim().min(1),
      slug: z.string().trim().min(1),
      description: z.string().trim().min(1),
      conditionType: conditionSchema,
      threshold: z.coerce.number().int().optional(),
      pointReward: z.coerce.number().int().min(0),
      active: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      conditionType: formData.get("conditionType"),
      threshold: formData.get("threshold") || undefined,
      pointReward: formData.get("pointReward"),
      active: formData.get("active") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid achievement" };
  }

  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    conditionType: parsed.data.conditionType as AchievementCondition,
    threshold: parsed.data.threshold ?? null,
    pointReward: parsed.data.pointReward,
    active: parsed.data.active ?? true,
    updatedAt: new Date(),
  };

  const db = getDb();
  if (id) {
    await db.update(achievements).set(values).where(eq(achievements.id, id));
  } else {
    await db.insert(achievements).values(values);
  }
  revalidatePath("/admin/achievements");
  revalidatePath("/achievements");
  return { success: "Achievement saved" };
}

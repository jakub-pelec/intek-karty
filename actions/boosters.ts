"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { boosterDropRates, boosterTypes, type Rarity } from "@/db/schema";
import { requireAdmin } from "@/lib/rbac";
import { assertRatesSumTo100 } from "@/lib/draw-engine";
import { RARITIES } from "@/lib/constants";
import { uploadImage } from "@/lib/storage";

function parseRates(formData: FormData) {
  return RARITIES.flatMap((rarity) =>
    [false, true].map((signed) => {
      const raw = formData.get(signed ? `rate_${rarity}_signed` : `rate_${rarity}`);
      if (raw === null || raw === "") return null;
      const percent = Number(raw);
      if (Number.isNaN(percent)) return null;
      return {
        rarity,
        signed,
        probabilityBp: Math.round(percent * 100),
      };
    }),
  )
    .filter(
      (row): row is { rarity: Rarity; signed: boolean; probabilityBp: number } =>
        row !== null,
    )
    .filter((row) => row.probabilityBp > 0);
}

export async function saveBoosterType(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = z
    .object({
      collectionId: z.string().uuid(),
      name: z.string().trim().min(1).max(80),
      slug: z.string().trim().min(1).max(80),
      twitchChannelPointCost: z.coerce.number().int().positive(),
      twitchRewardId: z.string().trim().optional(),
      holographicChance: z.coerce.number().min(0).max(100),
      frontImageUrl: z.string().trim().optional(),
      backImageUrl: z.string().trim().optional(),
      active: z.coerce.boolean().optional(),
    })
    .safeParse({
      collectionId: formData.get("collectionId"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      twitchChannelPointCost: formData.get("twitchChannelPointCost"),
      twitchRewardId: formData.get("twitchRewardId") || undefined,
      holographicChance: formData.get("holographicChance") || 0,
      frontImageUrl: formData.get("frontImageUrl") || undefined,
      backImageUrl: formData.get("backImageUrl") || undefined,
      active: formData.get("active") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booster" };
  }

  const rates = parseRates(formData);
  try {
    assertRatesSumTo100(rates);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Rates must sum to 100%" };
  }

  let frontImageUrl = parsed.data.frontImageUrl || null;
  let backImageUrl = parsed.data.backImageUrl || null;
  const frontFile = formData.get("frontImage");
  const backFile = formData.get("backImage");
  if (frontFile instanceof File && frontFile.size > 0) {
    frontImageUrl = await uploadImage(frontFile);
  }
  if (backFile instanceof File && backFile.size > 0) {
    backImageUrl = await uploadImage(backFile);
  }

  const db = getDb();
  const values = {
    collectionId: parsed.data.collectionId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    twitchChannelPointCost: parsed.data.twitchChannelPointCost,
    twitchRewardId: parsed.data.twitchRewardId || null,
    holographicChanceBp: Math.round(parsed.data.holographicChance * 100),
    frontImageUrl,
    backImageUrl,
    active: parsed.data.active ?? true,
    updatedAt: new Date(),
  };

  try {
    await db.transaction(async (tx) => {
      if (id) {
        await tx.update(boosterTypes).set(values).where(eq(boosterTypes.id, id));
        await tx.delete(boosterDropRates).where(eq(boosterDropRates.boosterTypeId, id));
        await tx.insert(boosterDropRates).values(
          rates.map((rate) => ({
            boosterTypeId: id,
            rarity: rate.rarity,
            signed: rate.signed,
            probabilityBp: rate.probabilityBp,
          })),
        );
        return;
      }
      const [created] = await tx.insert(boosterTypes).values(values).returning();
      await tx.insert(boosterDropRates).values(
        rates.map((rate) => ({
          boosterTypeId: created.id,
          rarity: rate.rarity,
          signed: rate.signed,
          probabilityBp: rate.probabilityBp,
        })),
      );
    });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "23505") return { error: "Slug or Twitch reward ID already in use" };
    throw error;
  }

  revalidatePath("/admin/boosters");
  revalidatePath("/admin/dev");
  revalidatePath("/admin/queue");
  revalidatePath("/collection");
  return { success: "Booster saved" };
}

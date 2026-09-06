"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { cards, type Rarity } from "@/db/schema";
import { requireAdmin } from "@/lib/rbac";
import { uploadCardImage } from "@/lib/storage";

const raritySchema = z.enum(["common", "rare", "epic", "legendary", "joker"]);

const cardSchema = z.object({
  collectionId: z.string().uuid(),
  number: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(2000),
  rarity: raritySchema,
  signed: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  imageUrl: z.string().trim().optional(),
});

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}

export async function createCard(formData: FormData) {
  await requireAdmin();
  const parsed = cardSchema.safeParse({
    collectionId: formData.get("collectionId"),
    number: formData.get("number"),
    name: formData.get("name"),
    description: formData.get("description"),
    rarity: formData.get("rarity"),
    signed: formData.get("signed") === "on",
    active: formData.get("active") === "on",
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid card" };

  let imageUrl = parsed.data.imageUrl || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await uploadCardImage(file);
  }
  if (parsed.data.signed && !imageUrl) {
    return { error: "Signed variants need their own artwork" };
  }

  try {
    await getDb().insert(cards).values({
      collectionId: parsed.data.collectionId,
      number: parsed.data.number,
      name: parsed.data.name,
      description: parsed.data.description,
      rarity: parsed.data.rarity as Rarity,
      signed: parsed.data.signed ?? false,
      active: parsed.data.active ?? true,
      imageUrl,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: `This collection already has a ${parsed.data.signed ? "signed" : "default"} card ${parsed.data.number}`,
      };
    }
    throw error;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/collections");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  return { success: "Card created" };
}

export async function updateCard(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing card id" };

  const parsed = cardSchema.safeParse({
    collectionId: formData.get("collectionId"),
    number: formData.get("number"),
    name: formData.get("name"),
    description: formData.get("description"),
    rarity: formData.get("rarity"),
    signed: formData.get("signed") === "on",
    active: formData.get("active") === "on",
    imageUrl: formData.get("imageUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid card" };

  let imageUrl = parsed.data.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await uploadCardImage(file);
  }
  if (parsed.data.signed && !imageUrl) {
    return { error: "Signed variants need their own artwork" };
  }

  try {
    await getDb()
      .update(cards)
      .set({
        collectionId: parsed.data.collectionId,
        number: parsed.data.number,
        name: parsed.data.name,
        description: parsed.data.description,
        rarity: parsed.data.rarity as Rarity,
        signed: parsed.data.signed ?? false,
        active: parsed.data.active ?? true,
        imageUrl: imageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        error: `This collection already has a ${parsed.data.signed ? "signed" : "default"} card ${parsed.data.number}`,
      };
    }
    throw error;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/collections");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  return { success: "Card updated" };
}

export async function setCardActive(id: string, active: boolean) {
  await requireAdmin();
  await getDb()
    .update(cards)
    .set({ active, updatedAt: new Date() })
    .where(eq(cards.id, id));
  revalidatePath("/admin/cards");
  revalidatePath("/admin/collections");
  revalidatePath("/collection");
}

export async function moveCardToCollection(formData: FormData) {
  await requireAdmin();
  const cardId = String(formData.get("cardId") ?? "");
  const collectionId = String(formData.get("collectionId") ?? "");
  if (!cardId || !collectionId) return { error: "Choose a card and collection" };

  const [card] = await getDb()
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);
  if (!card) return { error: "Card not found" };

  try {
    await getDb()
      .update(cards)
      .set({ collectionId, updatedAt: new Date() })
      .where(eq(cards.id, cardId));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "This collection already has that number/variant" };
    }
    throw error;
  }

  revalidatePath("/admin/cards");
  revalidatePath("/admin/collections");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  return { success: "Card moved" };
}

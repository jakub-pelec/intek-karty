"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { collections } from "@/db/schema";
import { requireAdmin } from "@/lib/rbac";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(400).optional(),
  sortOrder: z.coerce.number().int().default(0),
  active: z.coerce.boolean().optional(),
});

export async function saveCollection(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = collectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid collection" };
  }

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return { error: "Slug is required" };

  const values = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    sortOrder: parsed.data.sortOrder,
    active: parsed.data.active ?? true,
    updatedAt: new Date(),
  };

  try {
    if (id) {
      await getDb().update(collections).set(values).where(eq(collections.id, id));
    } else {
      await getDb().insert(collections).values(values);
    }
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code: string }).code)
        : "";
    if (code === "23505") return { error: "That slug is already in use" };
    throw error;
  }

  revalidatePath("/admin/collections");
  revalidatePath("/admin/cards");
  revalidatePath("/admin/boosters");
  revalidatePath("/collection");
  revalidatePath("/dashboard");
  return { success: id ? "Collection saved" : "Collection created" };
}

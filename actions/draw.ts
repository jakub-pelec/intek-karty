"use server";

import { revalidatePath } from "next/cache";
import { DrawError, openUserBooster } from "@/db/queries/draw";
import { requireAdmin } from "@/lib/rbac";

export async function openBoosterAction(userBoosterId: string) {
  const admin = await requireAdmin();
  try {
    const result = await openUserBooster({
      userBoosterId,
      adminId: admin.id,
    });
    revalidatePath("/admin/queue");
    revalidatePath("/admin/history");
    revalidatePath("/collection");
    revalidatePath("/dashboard");
    revalidatePath("/history");
    revalidatePath("/achievements");
    const variants = [
      result.holographic ? "holo" : null,
      result.signature ? "signed" : null,
    ]
      .filter(Boolean)
      .join(" + ");
    const name = variants ? `${result.card.name} (${variants})` : result.card.name;
    return {
      success: result.isDuplicate
        ? `Duplicate ${name} — ${result.pointsAwarded} points`
        : `Opened ${name}`,
      result,
    };
  } catch (error) {
    if (error instanceof DrawError) return { error: error.message };
    throw error;
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { DrawError, openUserBooster } from "@/db/queries/draw";
import { translateDrawError } from "@/lib/i18n-errors";
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
    const t = await getTranslations();
    const variants = [
      result.holographic ? t("common.holo") : null,
      result.signature ? t("common.signed") : null,
    ]
      .filter(Boolean)
      .join(" + ");
    const name = variants ? `${result.card.name} (${variants})` : result.card.name;
    return {
      success: result.isDuplicate
        ? t("openPack.duplicateCard", { name, points: result.pointsAwarded })
        : t("openPack.openedCard", { name }),
      result,
    };
  } catch (error) {
    if (error instanceof DrawError) {
      const t = await getTranslations("errors");
      return { error: translateDrawError(t, error.message) };
    }
    throw error;
  }
}

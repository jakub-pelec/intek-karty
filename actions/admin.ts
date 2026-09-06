"use server";

import { revalidatePath } from "next/cache";
import {
  addBoosterToUser,
  adjustPoints,
  AdminActionError,
  grantCard,
  revokeCard,
} from "@/db/queries/admin";
import { requireAdmin } from "@/lib/rbac";

export async function grantCardAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await grantCard({
      userId: String(formData.get("userId") ?? ""),
      cardId: String(formData.get("cardId") ?? ""),
      adminId: admin.id,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/users");
    return { success: "Card granted" };
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    throw error;
  }
}

export async function revokeCardAction(formData: FormData) {
  await requireAdmin();
  try {
    await revokeCard({
      userId: String(formData.get("userId") ?? ""),
      cardId: String(formData.get("cardId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/users");
    return { success: "Card revoked" };
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    throw error;
  }
}

export async function adjustPointsAction(formData: FormData) {
  const admin = await requireAdmin();
  try {
    await adjustPoints({
      userId: String(formData.get("userId") ?? ""),
      amount: Number(formData.get("amount")),
      adminId: admin.id,
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/users");
    return { success: "Points updated" };
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    throw error;
  }
}

export async function addBoosterAction(formData: FormData) {
  await requireAdmin();
  try {
    await addBoosterToUser({
      userId: String(formData.get("userId") ?? ""),
      boosterTypeId: String(formData.get("boosterTypeId") ?? ""),
      reason: String(formData.get("reason") ?? ""),
    });
    revalidatePath("/admin/queue");
    revalidatePath("/admin/users");
    return { success: "Booster added to queue" };
  } catch (error) {
    if (error instanceof AdminActionError) return { error: error.message };
    throw error;
  }
}

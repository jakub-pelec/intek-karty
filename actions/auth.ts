"use server";

import { signIn, signOut } from "@/auth";

function safeCallbackUrl(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") return "/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function loginWithTwitch(formData: FormData) {
  await signIn("twitch", {
    redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
  });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

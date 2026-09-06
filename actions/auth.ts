"use server";

import { signIn, signOut } from "@/auth";

export async function loginWithTwitch(callbackUrl?: string) {
  await signIn("twitch", { redirectTo: callbackUrl || "/dashboard" });
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

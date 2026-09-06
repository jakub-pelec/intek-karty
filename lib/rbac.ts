import { cache } from "react";
import { auth } from "@/auth";
import { getUserById } from "@/db/queries/users";
import type { Role } from "@/db/schema";

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("You must be signed in", 401);
  }
  const user = await getUserById(session.user.id);
  if (!user) {
    throw new AuthError("Session user no longer exists", 401);
  }
  return user;
});

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export function isAdminRole(role: string | undefined) {
  return role === "admin";
}

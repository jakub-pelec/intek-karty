import type { ReactNode } from "react";
import { RitualShell } from "@/components/ritual-shell";
import { requireUser } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <RitualShell user={user}>{children}</RitualShell>;
}

import type { ReactNode } from "react";
import { RitualShell } from "@/components/ritual-shell";
import { requireAdmin } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <RitualShell user={user}>{children}</RitualShell>;
}

import type { ReactNode } from "react";
import { logout } from "@/actions/auth";
import { RitualNav } from "@/components/ritual-nav";
import type { Role } from "@/db/schema";

type UserInfo = {
  name: string;
  role: Role;
  pointsBalance: number;
};

export function RitualShell({
  user,
  children,
}: {
  user: UserInfo;
  children: ReactNode;
}) {
  return (
    <div className="ritual relative min-h-dvh overflow-x-hidden">
      <div className="ritual-glow pointer-events-none fixed inset-0 z-0" />
      <div className="ritual-stars pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex flex-col items-center gap-8 px-6 pt-10 pb-6 md:px-12 md:pt-12">
          <div className="flex w-full max-w-5xl items-start justify-between gap-4">
            <span className="font-[family-name:var(--font-cinzel)] text-sm font-medium tracking-[0.5em] text-[#d4b36a] uppercase">
              Intek Binder
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
              >
                {user.name} · {user.pointsBalance} · depart
              </button>
            </form>
          </div>
          <RitualNav showAdmin={user.role === "admin"} />
        </header>
        <div className="flex-1 px-4 pb-24 md:px-8">{children}</div>
      </div>
    </div>
  );
}

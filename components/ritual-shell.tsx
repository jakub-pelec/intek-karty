import { Suspense, type ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { logout } from "@/actions/auth";
import { LanguageSwitch } from "@/components/language-switch";
import { RitualNav } from "@/components/ritual-nav";
import { RitualPageCache } from "@/components/ritual-page-cache";
import type { Role } from "@/db/schema";

type UserInfo = {
  name: string;
  role: Role;
  pointsBalance: number;
};

export async function RitualShell({
  user,
  children,
}: {
  user: UserInfo;
  children: ReactNode;
}) {
  const t = await getTranslations();
  return (
    <div className="ritual relative min-h-dvh overflow-x-hidden">
      <div className="ritual-glow pointer-events-none fixed inset-0 z-0" />
      <div className="ritual-stars pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex flex-col items-center px-4 pt-6 md:px-12 md:pt-12">
          <div className="flex w-full max-w-5xl items-start justify-between gap-4">
            <span className="font-[family-name:var(--font-cinzel)] text-sm font-medium tracking-[0.5em] text-[#d4b36a] uppercase">
              {t("brand")}
            </span>
            <div className="flex items-center gap-4">
              <LanguageSwitch />
              <form action={logout}>
                <button
                  type="submit"
                  className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
                >
                  {user.name} · {user.pointsBalance} · {t("common.depart")}
                </button>
              </form>
            </div>
          </div>
          <div
            aria-hidden
            className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#d4b36a] to-transparent md:mt-7"
          />
          <div className="mt-5 w-full md:mt-7">
            <RitualNav showAdmin={user.role === "admin"} />
          </div>
          <div
            aria-hidden
            className="mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#d4b36a] to-transparent md:mt-7"
          />
        </header>
        <div className="flex-1 px-4 pb-24 md:px-8">
          <Suspense fallback={children}>
            <RitualPageCache>{children}</RitualPageCache>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

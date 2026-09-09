import { loginWithTwitch } from "@/actions/auth";
import { LanguageSwitch } from "@/components/language-switch";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

const LOGIN_ERROR_KEYS = {
  AccessDenied: "AccessDenied",
  Configuration: "Configuration",
  OAuthCallback: "OAuthCallback",
} as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations();
  const errorKey =
    params.error && params.error in LOGIN_ERROR_KEYS
      ? LOGIN_ERROR_KEYS[params.error as keyof typeof LOGIN_ERROR_KEYS]
      : params.error
        ? "Default"
        : null;
  const message = errorKey ? t(`login.errors.${errorKey}`) : null;

  return (
    <div className="ritual relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="ritual-glow pointer-events-none fixed inset-0 z-0" />
      <div className="ritual-stars pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex flex-col items-center px-6 pt-10 pb-6 md:px-12 md:pt-12">
          <div className="flex w-full max-w-5xl items-start justify-between gap-4">
            <span className="font-[family-name:var(--font-cinzel)] text-sm font-medium tracking-[0.5em] text-[#d4b36a] uppercase">
              {t("brand")}
            </span>
            <LanguageSwitch />
          </div>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
          <RitualPageHeader title={t("login.title")} eyebrow={t("login.eyebrow")} />
          <p className="max-w-md text-center font-[family-name:var(--font-cormorant)] text-[24px] tracking-wide text-[#d7d3c8]/80 italic md:text-[28px]">
            {t("login.body")}
          </p>
          {message ? (
            <p className="mt-8 border border-[#8b1e2d]/50 bg-[#1a0a0c] px-4 py-2 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#f3efe6] uppercase">
              {message}
            </p>
          ) : null}
          <div className="relic-plinth mt-14 flex w-[min(100%,420px)] flex-col items-center px-6 pt-8">
            <form action={loginWithTwitch}>
              {params.callbackUrl ? (
                <input
                  type="hidden"
                  name="callbackUrl"
                  value={params.callbackUrl}
                />
              ) : null}
              <Button variant="primary" size="lg" type="submit">
                {t("login.enter")}
              </Button>
            </form>
            <p className="mt-4 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.22em] text-[#d7d3c8]/40 uppercase">
              {t("login.viaTwitch")}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

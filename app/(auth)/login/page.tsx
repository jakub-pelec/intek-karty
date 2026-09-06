import { loginWithTwitch } from "@/actions/auth";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { Button } from "@/components/ui/button";

const ERRORS: Record<string, string> = {
  AccessDenied: "Twitch login was cancelled. You can try again.",
  Configuration: "Login is misconfigured. Check Twitch app credentials.",
  OAuthCallback: "Twitch returned an error. Please retry.",
  Default: "Something went wrong during login. Please retry.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const message = params.error
    ? (ERRORS[params.error] ?? ERRORS.Default)
    : null;

  return (
    <div className="ritual relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="ritual-glow pointer-events-none fixed inset-0 z-0" />
      <div className="ritual-stars pointer-events-none fixed inset-0 z-0 opacity-30" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex flex-col items-center px-6 pt-10 pb-6 md:px-12 md:pt-12">
          <span className="font-[family-name:var(--font-cinzel)] text-sm font-medium tracking-[0.5em] text-[#d4b36a] uppercase">
            Intek Binder
          </span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
          <RitualPageHeader title="The Threshold" eyebrow="Stream collection" />
          <p className="max-w-md text-center font-[family-name:var(--font-cormorant)] text-xl tracking-wide text-[#d7d3c8]/80 italic md:text-2xl">
            Approach to bind relics, gather echoes, and receive titles.
          </p>
          {message ? (
            <p className="mt-8 border border-[#8b1e2d]/50 bg-[#1a0a0c] px-4 py-2 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#f3efe6] uppercase">
              {message}
            </p>
          ) : null}
          <div className="relic-plinth mt-14 flex w-[min(100%,420px)] flex-col items-center px-6 pt-8">
            <form
              action={async () => {
                "use server";
                await loginWithTwitch(params.callbackUrl);
              }}
            >
              <Button variant="primary" size="lg" type="submit">
                Enter
              </Button>
            </form>
            <p className="mt-4 font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.22em] text-[#d7d3c8]/40 uppercase">
              Via Twitch
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

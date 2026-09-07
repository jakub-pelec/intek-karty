import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LandingAtmosphere, LandingPackAura } from "@/components/landing-atmosphere";
import { SEED_BOOSTERS } from "@/db/seed-data/boosters";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LANDING_PACKS = [
  {
    pack: SEED_BOOSTERS[0],
    float: "landing-pack-float-a",
    className:
      "z-10 w-[170px] -translate-x-16 translate-y-8 -rotate-[14deg] transition-transform duration-500 ease-out sm:w-[200px] md:w-[230px] md:-translate-x-24 group-hover:-translate-x-28 group-hover:translate-y-8 group-hover:-rotate-[14deg] md:group-hover:-translate-x-40",
  },
  {
    pack: SEED_BOOSTERS[1],
    float: "landing-pack-float-b",
    className:
      "z-10 w-[170px] translate-x-16 -translate-y-4 rotate-[16deg] transition-transform duration-500 ease-out sm:w-[200px] md:w-[230px] md:translate-x-24 group-hover:translate-x-28 group-hover:-translate-y-4 group-hover:rotate-[16deg] md:group-hover:translate-x-40",
  },
  {
    pack: SEED_BOOSTERS[2],
    float: "landing-pack-float-c",
    className:
      "z-20 w-[196px] translate-y-6 -rotate-[3deg] transition-transform duration-500 ease-out sm:w-[228px] md:w-[260px] group-hover:translate-y-14 group-hover:-rotate-[3deg]",
  },
] as const;

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="ritual relative flex min-h-dvh flex-col overflow-hidden">
      <LandingAtmosphere />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex flex-col items-center px-6 pt-10 pb-6 md:px-12 md:pt-12">
          <span className="font-[family-name:var(--font-cinzel)] text-sm font-medium tracking-[0.5em] text-[#d4b36a] uppercase">
            Intek Binder
          </span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
          <div className="flex w-full max-w-5xl flex-col items-center gap-12 md:flex-row md:gap-20">
            <div className="flex w-full flex-1 flex-col items-center md:items-start">
              <div className="flex w-full max-w-md flex-col items-center text-center md:items-start md:text-left">
                <p className="mb-4 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.3em] text-[#d4b36a] uppercase">
                  Digital Collectibles
                </p>
                <h1 className="mb-6 font-[family-name:var(--font-cormorant)] text-[48px] leading-tight tracking-wide text-[#cfc6b4] italic md:text-[64px]">
                  Bind relics during the stream.
                </h1>
                <p className="mb-12 font-[family-name:var(--font-cormorant)] text-[22px] tracking-wide text-[#d7d3c8]/80 italic md:text-[26px]">
                  Collect cards, chase rare variants, and earn titles while
                  watching.
                </p>
                <div className="relic-plinth flex w-full flex-col items-center pt-8">
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: "primary", size: "lg" }),
                      "w-full max-w-[200px]",
                    )}
                  >
                    Enter
                  </Link>
                  <p className="mt-4 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.22em] text-[#d7d3c8]/40 uppercase">
                    Via Twitch
                  </p>
                </div>
              </div>
            </div>
            <div className="group relative flex h-[360px] w-[300px] shrink-0 items-center justify-center sm:h-[460px] sm:w-[400px] md:h-[550px] md:w-[480px]">
              <LandingPackAura />
              {LANDING_PACKS.map(({ pack, className, float }) => (
                <div key={pack.slug} className={cn("absolute", className)}>
                  <div className={float}>
                    <Image
                      src={pack.frontImageUrl}
                      alt={pack.name}
                      width={1024}
                      height={1536}
                      unoptimized
                      sizes="(max-width: 640px) 196px, (max-width: 768px) 228px, 260px"
                      className="h-auto w-full [mix-blend-mode:normal]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <footer className="flex justify-center py-12 opacity-20">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#d4b36a] to-transparent" />
        </footer>
      </div>
    </div>
  );
}

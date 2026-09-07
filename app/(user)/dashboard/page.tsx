import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { CardInspect } from "@/components/card-inspect";
import { RelicFrame } from "@/components/relic-frame";
import { RarityGem } from "@/components/rarity-gem";
import { getDb } from "@/db";
import {
  achievements,
  cards,
  collections,
  draws,
  userAchievements,
} from "@/db/schema";
import {
  activeCardCount,
  collectionProgress,
  listActiveCollections,
} from "@/db/queries/collections";
import { rarityGlowColor } from "@/components/rarity-glow";
import { requireUser } from "@/lib/rbac";
import { toRoman } from "@/lib/ritual";
import { cn, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const db = getDb();

  const [titleCountRows, sets, recentDraws, recentAchievements] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userAchievements)
      .where(eq(userAchievements.userId, user.id)),
    listActiveCollections(),
    db
      .select({
        id: draws.id,
        cardId: draws.cardId,
        cardName: draws.cardName,
        cardNumber: draws.cardNumber,
        cardRarity: draws.cardRarity,
        cardImageUrl: draws.cardImageUrl,
        holographic: draws.holographic,
        signature: draws.signature,
        createdAt: draws.createdAt,
      })
      .from(draws)
      .where(eq(draws.userId, user.id))
      .orderBy(desc(draws.createdAt))
      .limit(5),
    db
      .select({
        name: achievements.name,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, user.id))
      .orderBy(desc(userAchievements.unlockedAt))
      .limit(5),
  ]);

  const defaultSet = sets[0] ?? null;
  const latest = recentDraws[0];
  const [relics, drawn] = await Promise.all([
    defaultSet
      ? collectionProgress(user.id, defaultSet.id)
      : Promise.resolve({ owned: 0, total: 0 }),
    latest?.cardId
      ? db
          .select({
            collectionId: cards.collectionId,
            backImageUrl: collections.backImageUrl,
            holoMapUrl: cards.holoMapUrl,
          })
          .from(cards)
          .innerJoin(collections, eq(cards.collectionId, collections.id))
          .where(eq(cards.id, latest.cardId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  const titles = Number(titleCountRows[0]?.count ?? 0);
  let latestTotal = relics.total;
  let latestBack: string | null = null;
  let latestHolo: string | null = null;
  if (drawn) {
    latestTotal = await activeCardCount(drawn.collectionId);
    latestBack = drawn.backImageUrl;
    latestHolo = drawn.holoMapUrl;
  }

  const wellColor = latest ? rarityGlowColor(latest.cardRarity) : "#d4b36a";

  return (
    <main className="flex flex-col items-center px-4 pt-2 pb-16 md:px-8 md:pt-8">
      <h1 className="mb-10 text-center font-[family-name:var(--font-cinzel)] text-[12px] font-medium tracking-[0.4em] text-[#d4b36a]/90 uppercase md:mb-12">
        Welcome, {user.name}.
      </h1>

      <div className="relative mb-12 flex w-full max-w-7xl flex-col lg:mb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="altar-pane-rule absolute top-8 bottom-8 left-[calc(33.333%-1.25rem)] w-px xl:left-[calc(33.333%-1.5rem)]" />
          <div className="altar-pane-rule absolute top-8 bottom-8 right-[calc(33.333%-1.25rem)] w-px xl:right-[calc(33.333%-1.5rem)]" />
        </div>

        <section className="order-2 flex flex-col pt-10 lg:order-1 lg:pt-12">
          <p className="mb-6 text-center font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            Recent Manifestations
          </p>
          {recentDraws.length === 0 ? (
            <p className="text-center text-[17px] text-[#d7d3c8]/40 italic">None yet.</p>
          ) : (
            <ul className="space-y-1">
              {recentDraws.map((draw, index) => (
                <li
                  key={draw.id}
                  className="altar-ember-row flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2 first:border-t"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span
                      className="h-2 w-2 shrink-0 animate-pulse motion-reduce:animate-none"
                      style={{ animationDelay: `${index * 0.45}s` }}
                    >
                      <RarityGem rarity={draw.cardRarity} />
                    </span>
                    <span className="truncate text-[18px] text-[#d7d3c8]/90 italic">
                      {String(draw.cardNumber).padStart(2, "0")} {draw.cardName}
                      {draw.signature ? (
                        <span className="ml-2 font-[family-name:var(--font-cinzel)] text-[8px] tracking-widest text-[#d4b36a]/70 not-italic uppercase">
                          Signed
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.1em] text-[#d7d3c8]/40 uppercase">
                    {draw.cardRarity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative order-1 mb-8 flex flex-col items-center lg:order-2 lg:mb-0">
          <p className="mb-6 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            The Latest Vision
          </p>
          <div className="altar-center-dust pointer-events-none absolute inset-0 -z-10 mt-10 opacity-50" />
          {latest ? (
            <div className="flex w-full flex-col items-center">
              <div className="relative w-full max-w-[380px]">
                <div
                  aria-hidden
                  className="altar-well pointer-events-none absolute -inset-y-[15%] -inset-x-[25%] z-0"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, color-mix(in srgb, #1a1630 80%, transparent) 0%, color-mix(in srgb, ${wellColor} 22%, transparent) 40%, transparent 70%)`,
                    filter: "blur(24px) saturate(1.5)",
                  }}
                />
                <CardInspect
                  className="relative z-10 w-full"
                  name={latest.cardName}
                  imageUrl={latest.cardImageUrl}
                  holoMapUrl={latestHolo}
                  backImageUrl={latestBack}
                  rarity={latest.cardRarity}
                  holographic={latest.holographic}
                  signature={latest.signature}
                  glow={false}
                />
              </div>
              <p className="mt-8 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.25em] text-[#d7d3c8]/50 uppercase">
                {toRoman(latest.cardNumber)} / {toRoman(latestTotal)}
              </p>
              <h2 className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-[36px] tracking-wider text-[#d7d3c8] italic md:text-[46px]">
                {latest.cardName}
              </h2>
              <span className="mt-3 font-[family-name:var(--font-cinzel)] text-[11px] font-semibold tracking-[0.3em] text-[#00e5ff] uppercase">
                {latest.cardRarity}
                {latest.holographic ? " holo" : ""}
                {latest.signature ? " signed" : ""}
              </span>
              <span className="mt-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.1em] text-[#d7d3c8]/40 uppercase">
                {formatDate(latest.createdAt)}
              </span>
            </div>
          ) : (
            <RelicFrame sealed className="w-full max-w-[380px]">
              <div className="flex h-full items-center justify-center px-8 text-center">
                <p className="font-[family-name:var(--font-cormorant)] text-[26px] text-[#d7d3c8]/40 italic">
                  No vision yet. Watch the stream.
                </p>
              </div>
            </RelicFrame>
          )}
        </section>

        <section className="order-3 flex flex-col pt-10 lg:pt-12">
          <p className="mb-6 text-center font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] text-[#d4b36a]/60 uppercase lg:mb-8">
            Titles Bestowed
          </p>
          {recentAchievements.length === 0 ? (
            <p className="text-center text-[17px] text-[#d7d3c8]/40 italic">
              None unlocked yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {recentAchievements.map((row) => (
                <li
                  key={row.name}
                  className="altar-ember-row flex flex-col items-center justify-center gap-1 border-b border-white/5 px-3 py-4 first:border-t"
                >
                  <span className="text-center font-[family-name:var(--font-cinzel)] text-[13px] tracking-widest text-[#d7d3c8]/90 uppercase">
                    {row.name}
                  </span>
                  <span className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#d7d3c8]/30 uppercase">
                    {formatDate(row.unlockedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="relic-plinth mx-auto grid w-full max-w-6xl grid-cols-3 gap-3 px-3 pt-8 pb-4 md:gap-8 md:px-8 md:pt-10 md:pb-6">
        <Link
          href="/collection"
          className="group relative flex min-w-0 flex-col items-center text-center"
        >
          <span className="relative font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a] md:text-[26px]">
            {relics.owned} / {relics.total}
          </span>
          <span className="relative mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-[14px] tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/80 md:mt-3 md:text-[10px] md:tracking-[0.15em]">
            Relics
            <br />
            Found
          </span>
        </Link>
        <Link
          href="/history"
          className={cn(
            "group relative flex min-w-0 flex-col items-center text-center",
            "border-[#d4b36a]/10 md:border-x",
          )}
        >
          <span className="relative font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a] md:text-[26px]">
            {user.pointsBalance}
          </span>
          <span className="relative mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-[14px] tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/80 md:mt-3 md:text-[10px] md:tracking-[0.15em]">
            Echoes
            <br />
            Gathered
          </span>
        </Link>
        <Link
          href="/achievements"
          className="group relative flex min-w-0 flex-col items-center text-center"
        >
          <span className="relative font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a] md:text-[26px]">
            {titles}
          </span>
          <span className="relative mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-[14px] tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/80 md:mt-3 md:text-[10px] md:tracking-[0.15em]">
            Titles
            <br />
            Bestowed
          </span>
        </Link>
      </div>
    </main>
  );
}

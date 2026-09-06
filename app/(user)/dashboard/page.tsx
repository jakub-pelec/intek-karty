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
import { CardBloom, rarityGlowColor } from "@/components/rarity-glow";
import { requireUser } from "@/lib/rbac";
import { toRoman } from "@/lib/ritual";
import { formatDate } from "@/lib/utils";

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
  if (drawn) {
    latestTotal = await activeCardCount(drawn.collectionId);
    latestBack = drawn.backImageUrl;
  }

  return (
    <main className="flex flex-col items-center pt-2 md:pt-8">
      <h1 className="mb-16 text-center font-[family-name:var(--font-cormorant)] text-[40px] tracking-wide text-[#cfc6b4] italic opacity-90 md:text-[53px]">
        Welcome, {user.name}.
      </h1>

      <div className="relative mb-16 flex flex-col items-center">
        <p className="mb-6 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.3em] text-[#d4b36a]/60 uppercase">
          The Latest Vision
        </p>
        {latest ? (
          <div className="flex flex-col items-center">
            <div className="relative w-[280px] md:w-[340px]">
              <CardBloom color={rarityGlowColor(latest.cardRarity)} />
              <CardInspect
                className="relative z-10 w-full"
                name={latest.cardName}
                imageUrl={latest.cardImageUrl}
                backImageUrl={latestBack}
                rarity={latest.cardRarity}
                holographic={latest.holographic}
                signature={latest.signature}
                glow={false}
              />
            </div>
            <p className="mt-5 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8]/40 uppercase">
              {toRoman(latest.cardNumber)} / {toRoman(latestTotal)}
            </p>
            <h2 className="mt-2 text-center font-[family-name:var(--font-cormorant)] text-[33px] tracking-wider text-[#d7d3c8] italic md:text-[40px]">
              {latest.cardName}
            </h2>
            <span className="mt-2 font-[family-name:var(--font-cinzel)] text-[10px] font-semibold tracking-[0.3em] text-[#00e5ff] uppercase">
              {latest.cardRarity}
              {latest.holographic ? " holo" : ""}
              {latest.signature ? " signed" : ""}
            </span>
            <span className="mt-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.1em] text-[#d7d3c8]/30 uppercase">
              {formatDate(latest.createdAt)}
            </span>
          </div>
        ) : (
          <RelicFrame sealed className="w-[280px] md:w-[340px]">
            <div className="flex h-full items-center justify-center px-8 text-center">
              <p className="font-[family-name:var(--font-cormorant)] text-[26px] text-[#d7d3c8]/40 italic">
                No vision yet. Watch the stream.
              </p>
            </div>
          </RelicFrame>
        )}

        <div className="relic-plinth mt-12 grid w-[min(100%,560px)] grid-cols-3 gap-3 px-3 pt-6 pb-2 md:gap-6 md:px-6">
          <Link href="/collection" className="group flex min-w-0 flex-col items-center text-center">
            <span className="font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a]">
              {relics.owned} / {relics.total}
            </span>
            <span className="mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-3 tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/60">
              Relics
              <br />
              Found
            </span>
          </Link>
          <Link href="/history" className="group flex min-w-0 flex-col items-center text-center">
            <span className="font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a]">
              {user.pointsBalance}
            </span>
            <span className="mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-3 tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/60">
              Echoes
              <br />
              Gathered
            </span>
          </Link>
          <Link href="/achievements" className="group flex min-w-0 flex-col items-center text-center">
            <span className="font-[family-name:var(--font-cinzel)] text-[22px] text-[#d7d3c8] transition-colors group-hover:text-[#d4b36a]">
              {titles}
            </span>
            <span className="mt-2 max-w-full font-[family-name:var(--font-cinzel)] text-[9px] leading-3 tracking-[0.12em] text-[#d7d3c8]/40 uppercase transition-colors group-hover:text-[#d4b36a]/60">
              Titles
              <br />
              Bestowed
            </span>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-20 px-2 md:grid-cols-2 md:px-6">
        <section className="relative flex flex-col">
          <div className="absolute -top-1 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#d4b36a]/30 to-transparent" />
          <h3 className="pt-4 mb-6 text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
            Recent Manifestations
          </h3>
          {recentDraws.length === 0 ? (
            <p className="text-center text-[17px] text-[#d7d3c8]/40 italic">
              None yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {recentDraws.map((draw) => (
                <li
                  key={draw.id}
                  className="flex items-center justify-between gap-3 border-b border-white/5 py-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0">
                      <RarityGem rarity={draw.cardRarity} />
                    </span>
                    <span className="text-[17px] text-[#d7d3c8]/80 italic">
                      {String(draw.cardNumber).padStart(2, "0")} {draw.cardName}
                      {draw.signature ? (
                        <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[9px] text-[#d4b36a]/60 not-italic uppercase">
                          (Signed)
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.1em] text-[#d7d3c8]/40 uppercase">
                    {draw.cardRarity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="relative flex flex-col">
          <div className="absolute -top-1 right-0 left-0 h-px bg-gradient-to-r from-transparent via-[#d4b36a]/30 to-transparent" />
          <h3 className="pt-4 mb-6 text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.3em] text-[#d4b36a]/80 uppercase">
            Titles Bestowed
          </h3>
          {recentAchievements.length === 0 ? (
            <p className="text-center text-[17px] text-[#d7d3c8]/40 italic">
              None unlocked yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {recentAchievements.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between gap-3 border-b border-white/5 py-1"
                >
                  <span className="font-[family-name:var(--font-cinzel)] text-[12px] text-[#d7d3c8]/80">
                    {row.name}
                  </span>
                  <span className="font-[family-name:var(--font-cinzel)] text-[9px] tracking-widest text-[#d7d3c8]/30">
                    {formatDate(row.unlockedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

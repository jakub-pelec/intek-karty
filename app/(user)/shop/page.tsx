import { getDb } from "@/db";
import { rewards } from "@/db/schema";
import { RedeemButton } from "@/components/redeem-button";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { liveCms } from "@/lib/cms/live";
import { requireUser } from "@/lib/rbac";
import { getTranslations } from "next-intl/server";

export default async function ShopPage() {
  const db = getDb();
  const [user, catalog, t] = await Promise.all([
    requireUser(),
    db.select().from(rewards).where(liveCms(rewards)),
    getTranslations("offerings"),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title={t("title")}
        eyebrow={t("eyebrow", { points: user.pointsBalance })}
      />
      {catalog.length === 0 ? (
        <p className="text-center text-[#d7d3c8]/60 italic">{t("none")}</p>
      ) : (
        <ul className="space-y-5">
          {catalog.map((reward) => {
            const soldOut = reward.stock === 0;
            const unaffordable = user.pointsBalance < reward.pointCost;
            return (
              <li
                key={reward.id}
                className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6 py-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-[family-name:var(--font-cormorant)] text-[28px] text-[#f3efe6] italic">
                    {reward.name}
                  </h2>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d4b36a] uppercase">
                    {t("echoes", { count: reward.pointCost })}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#d7d3c8]">
                  {reward.description}
                </p>
                {reward.stock !== null ? (
                  <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/70 uppercase">
                    {t("remaining", { count: reward.stock })}
                  </p>
                ) : null}
                <div className="mt-4">
                  {soldOut ? (
                    <p className="font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.2em] text-[#d7d3c8]/50 uppercase">
                      {t("exhausted")}
                    </p>
                  ) : (
                    <RedeemButton
                      rewardId={reward.id}
                      disabled={unaffordable}
                    />
                  )}
                  {unaffordable && !soldOut ? (
                    <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/55 uppercase">
                      {t("notEnough")}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

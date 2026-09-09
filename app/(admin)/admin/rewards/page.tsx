import { desc, eq } from "drizzle-orm";
import { setRedemptionStatus } from "@/actions/shop";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { rewards, shopRedemptions, users } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AdminRewardsPage() {
  const [t, tStatus, locale] = await Promise.all([
    getTranslations("fulfillment"),
    getTranslations("redemptionStatus"),
    getLocale(),
  ]);
  const queue = await getDb()
    .select({
      id: shopRedemptions.id,
      createdAt: shopRedemptions.createdAt,
      pointsSpent: shopRedemptions.pointsSpent,
      status: shopRedemptions.status,
      rewardName: rewards.name,
      userName: users.name,
    })
    .from(shopRedemptions)
    .innerJoin(rewards, eq(shopRedemptions.rewardId, rewards.id))
    .innerJoin(users, eq(shopRedemptions.userId, users.id))
    .orderBy(desc(shopRedemptions.createdAt))
    .limit(50);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title={t("title")}
        eyebrow={t("eyebrow")}
      />
      {queue.length === 0 ? (
        <SanctumEmpty>{t("none")}</SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {queue.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-cormorant)] text-[24px] text-[#f3efe6] italic">
                    {row.userName}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                    {t("meta", {
                      reward: row.rewardName,
                      points: row.pointsSpent,
                      status: tStatus(row.status),
                    })}
                    {` · ${formatDate(row.createdAt, locale)}`}
                  </p>
                </div>
                {row.status === "pending_fulfillment" ? (
                  <ActionForm
                    action={setRedemptionStatus}
                    className="shrink-0 space-y-0"
                  >
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value="fulfilled" />
                    <Button type="submit">{t("fulfill")}</Button>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}
    </main>
  );
}

import { desc, eq } from "drizzle-orm";
import { setRedemptionStatus } from "@/actions/shop";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { rewards, shopRedemptions, users } from "@/db/schema";
import { formatDate } from "@/lib/utils";

export default async function AdminRewardsPage() {
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
        title="Fulfillment"
        eyebrow="Offerings are edited in Strapi"
      />
      <SanctumSection title="Redemption queue">
        {queue.length === 0 ? (
          <SanctumEmpty>No claims yet.</SanctumEmpty>
        ) : (
          <div className="space-y-3">
            {queue.map((row) => (
              <SanctumCard key={row.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-cormorant)] text-[22px] text-[#f3efe6] italic">
                      {row.userName}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                      {row.rewardName} · {row.pointsSpent} echoes · {row.status}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.12em] text-[#cfc6b4] uppercase">
                      {formatDate(row.createdAt)}
                    </p>
                  </div>
                  {row.status === "pending_fulfillment" ? (
                    <ActionForm
                      action={setRedemptionStatus}
                      className="flex gap-2 space-y-0"
                    >
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="status" value="fulfilled" />
                      <Button type="submit" size="sm">
                        Fulfill
                      </Button>
                    </ActionForm>
                  ) : null}
                </div>
              </SanctumCard>
            ))}
          </div>
        )}
      </SanctumSection>
    </main>
  );
}

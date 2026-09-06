import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rewards } from "@/db/schema";
import { RedeemButton } from "@/components/redeem-button";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { requireUser } from "@/lib/rbac";

export default async function ShopPage() {
  const user = await requireUser();
  const db = getDb();
  const catalog = await db.select().from(rewards).where(eq(rewards.active, true));

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Offerings"
        eyebrow={`${user.pointsBalance} echoes gathered`}
      />
      {catalog.length === 0 ? (
        <p className="text-center text-[#d7d3c8]/60 italic">No offerings yet.</p>
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
                  <h2 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                    {reward.name}
                  </h2>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d4b36a] uppercase">
                    {reward.pointCost} echoes
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#d7d3c8]">
                  {reward.description}
                </p>
                {reward.stock !== null ? (
                  <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.16em] text-[#d7d3c8]/70 uppercase">
                    {reward.stock} remaining
                  </p>
                ) : null}
                <div className="mt-4">
                  {soldOut ? (
                    <p className="font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.2em] text-[#d7d3c8]/50 uppercase">
                      Exhausted
                    </p>
                  ) : (
                    <RedeemButton
                      rewardId={reward.id}
                      disabled={unaffordable}
                    />
                  )}
                  {unaffordable && !soldOut ? (
                    <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.16em] text-[#d7d3c8]/55 uppercase">
                      Not enough echoes
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

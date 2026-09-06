import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rewards, shopRedemptions, users } from "@/db/schema";
import { saveReward } from "@/actions/shop";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { Check, Input, Label, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export default async function AdminRewardsPage() {
  const db = getDb();
  const catalog = await db.select().from(rewards);
  const queue = await db
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
        title="Rewards"
        eyebrow="Fulfillment is manual"
      />
      <SanctumSection title="New offering" className="mb-16">
        <SanctumCard>
          <ActionForm action={saveReward}>
            <RewardFields />
            <Button type="submit">Create</Button>
          </ActionForm>
        </SanctumCard>
      </SanctumSection>
      <SanctumSection title="Catalog" className="mb-16">
        <div className="space-y-5">
          {catalog.map((reward) => (
            <SanctumCard key={reward.id}>
              <h3 className="mb-5 font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                {reward.name}
              </h3>
              <ActionForm action={saveReward}>
                <input type="hidden" name="id" value={reward.id} />
                <RewardFields
                  defaults={{
                    name: reward.name,
                    description: reward.description,
                    pointCost: reward.pointCost,
                    stock: reward.stock,
                    active: reward.active,
                  }}
                />
                <Button type="submit">Save</Button>
              </ActionForm>
            </SanctumCard>
          ))}
        </div>
      </SanctumSection>
      <SanctumSection title="Redemption queue">
        {queue.length === 0 ? (
          <SanctumEmpty>No claims yet.</SanctumEmpty>
        ) : (
          <SanctumCard className="px-6 py-0">
            <ul>
              {queue.map((row) => (
                <li
                  key={row.id}
                  className="flex items-baseline justify-between gap-4 border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-cormorant)] text-xl text-[#f3efe6] italic">
                      {row.userName}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                      {row.rewardName} · {row.pointsSpent} echoes · {row.status}
                    </p>
                  </div>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.12em] text-[#cfc6b4] uppercase">
                    {formatDate(row.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </SanctumCard>
        )}
      </SanctumSection>
    </main>
  );
}

function RewardFields({
  defaults,
}: {
  defaults?: {
    name: string;
    description: string;
    pointCost: number;
    stock: number | null;
    active: boolean;
  };
}) {
  return (
    <>
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={defaults?.name} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" required defaultValue={defaults?.description} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Echo cost</Label>
          <Input name="pointCost" type="number" required defaultValue={defaults?.pointCost} />
        </div>
        <div>
          <Label>Stock (empty = unlimited)</Label>
          <Input name="stock" type="number" defaultValue={defaults?.stock ?? ""} />
        </div>
      </div>
      <Check name="active" defaultChecked={defaults?.active ?? true}>
        Active
      </Check>
    </>
  );
}

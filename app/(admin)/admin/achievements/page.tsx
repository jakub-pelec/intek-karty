import { getDb } from "@/db";
import { achievements } from "@/db/schema";
import { saveAchievement } from "@/actions/achievements";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { Check, Input, Label, Select, Textarea } from "@/components/ui/input";
import { ACHIEVEMENT_CONDITION_LABELS } from "@/lib/constants";

const conditions = Object.keys(ACHIEVEMENT_CONDITION_LABELS) as Array<
  keyof typeof ACHIEVEMENT_CONDITION_LABELS
>;

export default async function AdminAchievementsPage() {
  const catalog = await getDb().select().from(achievements);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Titles"
        eyebrow="Evaluated after each draw"
      />
      <SanctumSection title="New title" className="mb-16">
        <SanctumCard>
          <ActionForm action={saveAchievement}>
            <AchievementFields />
            <Button type="submit">Create</Button>
          </ActionForm>
        </SanctumCard>
      </SanctumSection>
      <SanctumSection title="Catalog">
        <div className="space-y-5">
          {catalog.map((achievement) => (
            <SanctumCard key={achievement.id}>
              <h3 className="mb-5 font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                {achievement.name}
              </h3>
              <ActionForm action={saveAchievement}>
                <input type="hidden" name="id" value={achievement.id} />
                <AchievementFields
                  defaults={{
                    name: achievement.name,
                    slug: achievement.slug,
                    description: achievement.description,
                    conditionType: achievement.conditionType,
                    threshold: achievement.threshold ?? undefined,
                    pointReward: achievement.pointReward,
                    active: achievement.active,
                  }}
                />
                <Button type="submit">Save</Button>
              </ActionForm>
            </SanctumCard>
          ))}
        </div>
      </SanctumSection>
    </main>
  );
}

function AchievementFields({
  defaults,
}: {
  defaults?: {
    name: string;
    slug: string;
    description: string;
    conditionType: string;
    threshold?: number;
    pointReward: number;
    active: boolean;
  };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input name="name" required defaultValue={defaults?.name} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input name="slug" required defaultValue={defaults?.slug} />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" required defaultValue={defaults?.description} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>Condition</Label>
          <Select name="conditionType" defaultValue={defaults?.conditionType ?? "first_booster"}>
            {conditions.map((condition) => (
              <option key={condition} value={condition}>
                {ACHIEVEMENT_CONDITION_LABELS[condition]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Threshold</Label>
          <Input name="threshold" type="number" defaultValue={defaults?.threshold} />
        </div>
        <div>
          <Label>Echo reward</Label>
          <Input name="pointReward" type="number" required defaultValue={defaults?.pointReward ?? 0} />
        </div>
      </div>
      <Check name="active" defaultChecked={defaults?.active ?? true}>
        Active
      </Check>
    </>
  );
}

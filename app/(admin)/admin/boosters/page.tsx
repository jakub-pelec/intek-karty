import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { boosterDropRates, boosterTypes, collections } from "@/db/schema";
import { saveBoosterType } from "@/actions/boosters";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { Check, Input, Label, Select } from "@/components/ui/input";
import { RARITY_LABELS, RARITIES } from "@/lib/constants";

type RatePair = { default: number; signed: number };

function ratesFromRows(
  rows: { rarity: string; signed: boolean; probabilityBp: number }[],
) {
  const rates: Record<string, RatePair> = {};
  for (const rate of rows) {
    const pair = rates[rate.rarity] ?? { default: 0, signed: 0 };
    if (rate.signed) pair.signed = rate.probabilityBp / 100;
    else pair.default = rate.probabilityBp / 100;
    rates[rate.rarity] = pair;
  }
  return rates;
}

export default async function AdminBoostersPage() {
  const db = getDb();
  const [types, rates, sets] = await Promise.all([
    db.select().from(boosterTypes),
    db.select().from(boosterDropRates),
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);
  const options = sets.map((set) => ({ id: set.id, name: set.name }));
  const ratesByType = new Map<
    string,
    { rarity: string; signed: boolean; probabilityBp: number }[]
  >();
  for (const rate of rates) {
    const list = ratesByType.get(rate.boosterTypeId) ?? [];
    list.push(rate);
    ratesByType.set(rate.boosterTypeId, list);
  }

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Boosters"
        eyebrow="Default and signed rates must sum to 100%"
      />
      <SanctumSection title="New booster" className="mb-16">
        <SanctumCard>
          <ActionForm action={saveBoosterType}>
            <BoosterFields collections={options} />
            <Button type="submit">Create</Button>
          </ActionForm>
        </SanctumCard>
      </SanctumSection>
      <SanctumSection title="Catalog">
        <div className="space-y-5">
          {types.map((type) => (
            <SanctumCard key={type.id}>
              <h3 className="mb-5 font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                {type.name}
              </h3>
              <ActionForm action={saveBoosterType}>
                <input type="hidden" name="id" value={type.id} />
                <BoosterFields
                  collections={options}
                  defaults={{
                    collectionId: type.collectionId,
                    name: type.name,
                    slug: type.slug,
                    twitchChannelPointCost: type.twitchChannelPointCost,
                    twitchRewardId: type.twitchRewardId ?? "",
                    holographicChance: type.holographicChanceBp / 100,
                    frontImageUrl: type.frontImageUrl ?? "",
                    backImageUrl: type.backImageUrl ?? "",
                    active: type.active,
                    rates: ratesFromRows(ratesByType.get(type.id) ?? []),
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

function BoosterFields({
  collections,
  defaults,
}: {
  collections: { id: string; name: string }[];
  defaults?: {
    collectionId: string;
    name: string;
    slug: string;
    twitchChannelPointCost: number;
    twitchRewardId: string;
    holographicChance?: number;
    frontImageUrl?: string;
    backImageUrl?: string;
    active: boolean;
    rates: Record<string, RatePair>;
  };
}) {
  return (
    <>
      <div>
        <Label>Collection</Label>
        <Select
          name="collectionId"
          required
          defaultValue={defaults?.collectionId ?? collections[0]?.id}
        >
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input name="name" required defaultValue={defaults?.name} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input name="slug" required defaultValue={defaults?.slug} />
        </div>
        <div>
          <Label>Twitch channel point cost</Label>
          <Input
            name="twitchChannelPointCost"
            type="number"
            required
            defaultValue={defaults?.twitchChannelPointCost}
          />
        </div>
        <div>
          <Label>Twitch reward ID</Label>
          <Input name="twitchRewardId" defaultValue={defaults?.twitchRewardId} />
        </div>
        <div>
          <Label>Holographic %</Label>
          <Input
            name="holographicChance"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={defaults?.holographicChance ?? 0}
          />
        </div>
        <div>
          <Label>Front image URL</Label>
          <Input name="frontImageUrl" defaultValue={defaults?.frontImageUrl} />
        </div>
        <div>
          <Label>Back image URL</Label>
          <Input name="backImageUrl" defaultValue={defaults?.backImageUrl} />
        </div>
        <div>
          <Label>Upload front</Label>
          <Input name="frontImage" type="file" accept="image/*,.svg" />
        </div>
        <div>
          <Label>Upload back</Label>
          <Input name="backImage" type="file" accept="image/*,.svg" />
        </div>
      </div>
      {defaults?.frontImageUrl || defaults?.backImageUrl ? (
        <div className="flex gap-3">
          {defaults.frontImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaults.frontImageUrl}
              alt=""
              className="h-24 w-16 object-cover"
            />
          ) : null}
          {defaults.backImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaults.backImageUrl}
              alt=""
              className="h-24 w-16 object-cover"
            />
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {RARITIES.map((rarity) => (
          <div key={rarity} className="space-y-2">
            <div>
              <Label>{RARITY_LABELS[rarity]} %</Label>
              <Input
                name={`rate_${rarity}`}
                type="number"
                step="0.01"
                defaultValue={defaults?.rates[rarity]?.default ?? ""}
              />
            </div>
            <div>
              <Label>{RARITY_LABELS[rarity]} signed %</Label>
              <Input
                name={`rate_${rarity}_signed`}
                type="number"
                step="0.01"
                defaultValue={defaults?.rates[rarity]?.signed ?? ""}
              />
            </div>
          </div>
        ))}
      </div>
      <Check name="active" defaultChecked={defaults?.active ?? true}>
        Active
      </Check>
    </>
  );
}

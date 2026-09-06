import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { cards, collections } from "@/db/schema";
import { createCard, setCardActive, updateCard } from "@/actions/cards";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumSection } from "@/components/sanctum";
import { Button } from "@/components/ui/button";
import { Check, Input, Label, Select, Textarea } from "@/components/ui/input";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { formatCardNumber } from "@/lib/utils";
import { RARITY_LABELS, RARITIES } from "@/lib/constants";

type CollectionOption = { id: string; name: string };

export default async function AdminCardsPage() {
  const db = getDb();
  const [catalog, sets] = await Promise.all([
    db.select().from(cards).orderBy(cards.number, cards.signed),
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
  ]);
  const setById = new Map(sets.map((set) => [set.id, set]));
  const grouped = sets.map((set) => ({
    set,
    cards: catalog.filter((card) => card.collectionId === set.id),
  }));
  const options = sets.map((set) => ({ id: set.id, name: set.name }));

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Cards"
        eyebrow="Each card belongs to one collection"
      />
      <SanctumSection title="New card" className="mb-16">
        <SanctumCard>
          {options.length === 0 ? (
            <SanctumEmpty>Create a collection first.</SanctumEmpty>
          ) : (
            <ActionForm action={createCard}>
              <CardFields collections={options} />
              <Button type="submit">Create</Button>
            </ActionForm>
          )}
        </SanctumCard>
      </SanctumSection>
      {grouped.map(({ set, cards: setCards }) => (
        <SanctumSection key={set.id} title={set.name} className="mb-16 last:mb-0">
          {setCards.length === 0 ? (
            <SanctumEmpty>No cards in this collection.</SanctumEmpty>
          ) : (
            <div className="space-y-5">
              {setCards.map((card) => (
                <SanctumCard key={card.id}>
                  <div className="mb-5 flex flex-wrap items-baseline gap-3">
                    <h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                      {formatCardNumber(card.number)} {card.name}
                    </h3>
                    <RarityBadge rarity={card.rarity} />
                    <MutationBadges signature={card.signed} />
                    {!card.active ? (
                      <span className="font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.16em] text-[#d7d3c8]/40 uppercase">
                        Inactive
                      </span>
                    ) : null}
                  </div>
                  <ActionForm action={updateCard}>
                    <input type="hidden" name="id" value={card.id} />
                    <CardFields
                      collections={options}
                      defaults={{
                        collectionId: card.collectionId,
                        number: card.number,
                        name: card.name,
                        description: card.description,
                        rarity: card.rarity,
                        signed: card.signed,
                        imageUrl: card.imageUrl ?? "",
                        active: card.active,
                      }}
                    />
                    <Button type="submit">Save</Button>
                  </ActionForm>
                  <form action={setCardActive.bind(null, card.id, !card.active)} className="mt-3">
                    <Button type="submit" variant="ghost" size="sm">
                      {card.active ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </SanctumCard>
              ))}
            </div>
          )}
        </SanctumSection>
      ))}
      {catalog.some((card) => !setById.has(card.collectionId)) ? (
        <SanctumSection title="Unassigned">
          <SanctumEmpty>Cards are missing a collection.</SanctumEmpty>
        </SanctumSection>
      ) : null}
    </main>
  );
}

function CardFields({
  collections,
  defaults,
}: {
  collections: CollectionOption[];
  defaults?: {
    collectionId: string;
    number: number;
    name: string;
    description: string;
    rarity: string;
    signed?: boolean;
    imageUrl: string;
    active: boolean;
  };
}) {
  return (
    <>
      <div>
        <Label>Collection</Label>
        <Select name="collectionId" required defaultValue={defaults?.collectionId ?? collections[0]?.id}>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Number</Label>
          <Input name="number" type="number" required defaultValue={defaults?.number} />
        </div>
        <div>
          <Label>Rarity</Label>
          <Select name="rarity" defaultValue={defaults?.rarity ?? "common"}>
            {RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {RARITY_LABELS[rarity]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={defaults?.name} />
      </div>
      <div>
        <Label>Lore</Label>
        <Textarea name="description" required defaultValue={defaults?.description} />
      </div>
      <div>
        <Label>Image URL</Label>
        <Input name="imageUrl" defaultValue={defaults?.imageUrl} />
      </div>
      <div>
        <Label>Upload artwork</Label>
        <Input name="image" type="file" accept="image/*" />
      </div>
      <Check name="signed" defaultChecked={defaults?.signed ?? false}>
        Signed variant
      </Check>
      <Check name="active" defaultChecked={defaults?.active ?? true}>
        Active
      </Check>
    </>
  );
}

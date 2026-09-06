import { asc } from "drizzle-orm";
import { createCard, moveCardToCollection } from "@/actions/cards";
import { saveCollection } from "@/actions/collections";
import { ActionForm } from "@/components/action-form";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumSection } from "@/components/sanctum";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Input, Label, Select, Textarea } from "@/components/ui/input";
import { getDb } from "@/db";
import { cards, collections } from "@/db/schema";
import { RARITIES, RARITY_LABELS } from "@/lib/constants";
import { formatCardNumber } from "@/lib/utils";

export default async function AdminCollectionsPage() {
  const db = getDb();
  const [catalog, cardRows] = await Promise.all([
    db
      .select()
      .from(collections)
      .orderBy(asc(collections.sortOrder), asc(collections.name)),
    db.select().from(cards).orderBy(cards.number, cards.signed),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Collections"
        eyebrow="Each set has its own cards and boosters"
      />
      <SanctumSection title="New collection" className="mb-16">
        <SanctumCard>
          <ActionForm action={saveCollection}>
            <CollectionFields />
            <Button type="submit">Create</Button>
          </ActionForm>
        </SanctumCard>
      </SanctumSection>
      <SanctumSection title="Catalog">
        {catalog.length === 0 ? (
          <SanctumEmpty>No collections yet.</SanctumEmpty>
        ) : (
          <div className="space-y-5">
            {catalog.map((collection) => {
              const setCards = cardRows.filter((card) => card.collectionId === collection.id);
              const otherCollections = catalog.filter((set) => set.id !== collection.id);
              const otherCards = cardRows.filter((card) => card.collectionId !== collection.id);
              const nextNumber =
                setCards.reduce((max, card) => Math.max(max, card.number), 0) + 1;
              const names = new Map(catalog.map((set) => [set.id, set.name]));

              return (
                <SanctumCard key={collection.id}>
                  <h3 className="mb-5 font-[family-name:var(--font-cormorant)] text-2xl text-[#f3efe6] italic">
                    {collection.name}
                  </h3>
                  <ActionForm action={saveCollection}>
                    <input type="hidden" name="id" value={collection.id} />
                    <CollectionFields
                      defaults={{
                        name: collection.name,
                        slug: collection.slug,
                        description: collection.description ?? "",
                        sortOrder: collection.sortOrder,
                        active: collection.active,
                      }}
                    />
                    <Button type="submit">Save</Button>
                  </ActionForm>

                  <div className="mt-8 border-t border-[#d4b36a]/20 pt-6">
                    <p className="mb-4 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
                      Cards · {setCards.length}
                    </p>
                    {setCards.length === 0 ? (
                      <SanctumEmpty>No cards in this collection.</SanctumEmpty>
                    ) : (
                      <ul>
                        {setCards.map((card) => (
                          <li
                            key={card.id}
                            className="flex flex-col gap-3 border-b border-white/5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 flex-wrap items-baseline gap-3">
                              <span className="text-[15px] text-[#d7d3c8]/80 italic">
                                {formatCardNumber(card.number)} {card.name}
                              </span>
                              <RarityBadge rarity={card.rarity} />
                              <MutationBadges signature={card.signed} />
                              {!card.active ? (
                                <span className="font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.16em] text-[#d7d3c8]/40 uppercase">
                                  Inactive
                                </span>
                              ) : null}
                            </div>
                            {otherCollections.length > 0 ? (
                              <ActionForm
                                action={moveCardToCollection}
                                className="flex shrink-0 items-end gap-2 space-y-0"
                              >
                                <input type="hidden" name="cardId" value={card.id} />
                                <div className="min-w-36">
                                  <Label>Move to</Label>
                                  <Select name="collectionId" required>
                                    {otherCollections.map((set) => (
                                      <option key={set.id} value={set.id}>
                                        {set.name}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                                <Button type="submit" variant="ghost" size="sm">
                                  Remove
                                </Button>
                              </ActionForm>
                            ) : (
                              <span className="font-[family-name:var(--font-cinzel)] text-[8px] tracking-[0.14em] text-[#d7d3c8]/35 uppercase">
                                Create another collection to move this card
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {otherCards.length > 0 ? (
                    <div className="mt-6">
                      <ActionForm action={moveCardToCollection}>
                        <input type="hidden" name="collectionId" value={collection.id} />
                        <Label>Add existing card</Label>
                        <Select name="cardId" required>
                          {otherCards.map((card) => (
                            <option key={card.id} value={card.id}>
                              {names.get(card.collectionId) ?? "Other"} ·{" "}
                              {formatCardNumber(card.number)} {card.name}
                              {card.signed ? " (signed)" : ""}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit">Add</Button>
                      </ActionForm>
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <p className="mb-4 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.2em] text-[#d4b36a]/70 uppercase">
                      New card
                    </p>
                    <ActionForm action={createCard}>
                      <input type="hidden" name="collectionId" value={collection.id} />
                      <CardCreateFields nextNumber={nextNumber} />
                      <Button type="submit">Add card</Button>
                    </ActionForm>
                  </div>
                </SanctumCard>
              );
            })}
          </div>
        )}
      </SanctumSection>
    </main>
  );
}

function CollectionFields({
  defaults,
}: {
  defaults?: {
    name: string;
    slug: string;
    description: string;
    sortOrder: number;
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
        <Label>Slug</Label>
        <Input name="slug" defaultValue={defaults?.slug} placeholder="origin" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" defaultValue={defaults?.description} />
      </div>
      <div>
        <Label>Sort order</Label>
        <Input name="sortOrder" type="number" defaultValue={defaults?.sortOrder ?? 0} />
      </div>
      <Check name="active" defaultChecked={defaults?.active ?? true}>
        Active
      </Check>
    </>
  );
}

function CardCreateFields({ nextNumber }: { nextNumber: number }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Number</Label>
          <Input name="number" type="number" required defaultValue={nextNumber} />
        </div>
        <div>
          <Label>Rarity</Label>
          <Select name="rarity" defaultValue="common">
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
        <Input name="name" required />
      </div>
      <div>
        <Label>Lore</Label>
        <Textarea name="description" required />
      </div>
      <div>
        <Label>Image URL</Label>
        <Input name="imageUrl" />
      </div>
      <div>
        <Label>Upload artwork</Label>
        <Input name="image" type="file" accept="image/*" />
      </div>
      <Check name="signed">Signed variant</Check>
      <Check name="active" defaultChecked>
        Active
      </Check>
    </>
  );
}

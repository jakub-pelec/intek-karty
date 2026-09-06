import { and, eq } from "drizzle-orm";
import { CollectionBrowser } from "@/components/collection-browser";
import { getDb } from "@/db";
import { cards, userCards } from "@/db/schema";
import { listActiveCollections } from "@/db/queries/collections";
import { isLiveCmsRow, liveCms } from "@/lib/cms/live";
import { parseCollectionQuery, type CollectionSlot } from "@/lib/collection";
import { requireUser } from "@/lib/rbac";
import { toRoman } from "@/lib/ritual";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    set?: string | string[];
    own?: string | string[];
    rarity?: string | string[];
    variant?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const parsed = parseCollectionQuery(params);
  const db = getDb();
  const [user, sets] = await Promise.all([requireUser(), listActiveCollections()]);
  const selected = sets.find((set) => set.slug === parsed.set) ?? sets[0] ?? null;
  const query = { ...parsed, set: selected?.slug };

  const [catalog, owned] = await Promise.all([
    selected
      ? db
          .select()
          .from(cards)
          .where(and(eq(cards.collectionId, selected.id), liveCms(cards)))
          .orderBy(cards.number, cards.signed)
      : Promise.resolve([]),
    db.select().from(userCards).where(eq(userCards.userId, user.id)),
  ]);
  const ownedByCard = new Map(owned.map((row) => [row.cardId, row]));

  const slots: CollectionSlot[] = catalog.map((card) => {
    const own = ownedByCard.get(card.id);
    return {
      id: card.id,
      number: card.number,
      name: card.name,
      rarity: card.rarity,
      signed: card.signed,
      owned: own
        ? {
            id: card.id,
            name: card.name,
            description: card.description,
            rarity: card.rarity,
            imageUrl: card.imageUrl,
            holographic: own.holographic,
            signature: card.signed,
            acquiredAt: own.acquiredAt,
          }
        : null,
    };
  });

  const activeCatalog = catalog.filter((card) => isLiveCmsRow(card));
  const ownedInSet = activeCatalog.filter((card) => ownedByCard.has(card.id)).length;
  const total = activeCatalog.length;

  return (
    <main className="mx-auto w-full max-w-[104rem] pt-2 md:pt-6">
      <h1 className="mb-3 text-center font-[family-name:var(--font-cormorant)] text-[40px] tracking-wide text-[#cfc6b4] italic md:text-[53px]">
        Collection
      </h1>
      <p className="mb-10 text-center font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.3em] text-[#d4b36a]/70 uppercase">
        {toRoman(ownedInSet)} of {toRoman(total)} relics bound
      </p>
      <CollectionBrowser
        key={query.set ?? "set"}
        slots={slots}
        query={query}
        sets={sets.map((set) => ({ slug: set.slug, name: set.name }))}
        progress={{ owned: ownedInSet, total }}
        backImageUrl={selected?.backImageUrl}
      />
    </main>
  );
}

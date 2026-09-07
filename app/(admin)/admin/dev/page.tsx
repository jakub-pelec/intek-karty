import { BoosterOpenDemo } from "@/components/booster-open-demo";
import { BoosterPackPreview } from "@/components/booster-pack-preview";
import { CardInspect } from "@/components/card-inspect";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumSection } from "@/components/sanctum";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { getDb } from "@/db";
import { eq } from "drizzle-orm";
import { boosterTypes, cards, collections } from "@/db/schema";
import { liveCms } from "@/lib/cms/live";
import { SEED_BOOSTERS } from "@/db/seed-data/boosters";
import {
  FEATURED_SHOWCASE_CARD,
  FEATURED_SHOWCASE_SIGNED_CARD,
  SEED_CARDS,
} from "@/db/seed-data/cards";
import { ORIGIN_COLLECTION } from "@/db/seed-data/collections";
import type { Rarity } from "@/db/schema";
import { RARITIES } from "@/lib/constants";
import { formatCardNumber } from "@/lib/utils";

const SHOWCASE_RARITIES: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "joker",
];

const HOLO_VARIANTS = [
  { label: "Standard", holographic: false },
  { label: "Holographic", holographic: true },
] as const;

type ShowcaseCard = {
  number: number;
  name: string;
  rarity: Rarity;
  imageUrl: string | null;
  holoMapUrl?: string | null;
  backImageUrl?: string | null;
  signed?: boolean;
};

function withCollectionBack(
  card: ShowcaseCard | (typeof SEED_CARDS)[number],
): ShowcaseCard {
  return {
    number: card.number,
    name: card.name,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    holoMapUrl: "holoMapUrl" in card ? card.holoMapUrl : undefined,
    signed: card.signed,
    backImageUrl:
      "backImageUrl" in card && card.backImageUrl
        ? card.backImageUrl
        : ORIGIN_COLLECTION.backImageUrl,
  };
}

export default async function AdminDevPage() {
  let catalog: ShowcaseCard[] = [];
  let packs: {
    name: string;
    frontImageUrl: string | null;
    backImageUrl: string | null;
  }[] = SEED_BOOSTERS.map((booster) => ({
    name: booster.name,
    frontImageUrl: booster.frontImageUrl,
    backImageUrl: booster.backImageUrl,
  }));
  try {
    const db = getDb();
    catalog = await db
      .select({
        number: cards.number,
        name: cards.name,
        rarity: cards.rarity,
        imageUrl: cards.imageUrl,
        holoMapUrl: cards.holoMapUrl,
        signed: cards.signed,
        backImageUrl: collections.backImageUrl,
      })
      .from(cards)
      .innerJoin(collections, eq(cards.collectionId, collections.id))
      .where(liveCms(cards));
    const storedPacks = await db
      .select({
        name: boosterTypes.name,
        frontImageUrl: boosterTypes.frontImageUrl,
        backImageUrl: boosterTypes.backImageUrl,
      })
      .from(boosterTypes)
      .where(liveCms(boosterTypes));
    if (storedPacks.some((pack) => pack.frontImageUrl || pack.backImageUrl)) {
      packs = storedPacks;
    }
  } catch {
    catalog = SEED_CARDS.map((card) => ({
      ...card,
      backImageUrl: ORIGIN_COLLECTION.backImageUrl,
    }));
  }

  const featured =
    catalog.find(
      (card) =>
        !card.signed && card.imageUrl === FEATURED_SHOWCASE_CARD.imageUrl,
    ) ?? { ...FEATURED_SHOWCASE_CARD, backImageUrl: ORIGIN_COLLECTION.backImageUrl };
  const featuredSigned =
    catalog.find(
      (card) =>
        card.signed &&
        (card.imageUrl === FEATURED_SHOWCASE_SIGNED_CARD.imageUrl ||
          card.number === FEATURED_SHOWCASE_SIGNED_CARD.number),
    ) ?? { ...FEATURED_SHOWCASE_SIGNED_CARD, backImageUrl: ORIGIN_COLLECTION.backImageUrl };

  const samples = [
    featured,
    featuredSigned,
    ...SHOWCASE_RARITIES.map((rarity) => {
      const card =
        catalog.find((row) => row.rarity === rarity && !row.signed) ??
        SEED_CARDS.find((row) => row.rarity === rarity && !row.signed);
      return card ? withCollectionBack(card) : undefined;
    }),
  ].filter((card): card is ShowcaseCard => Boolean(card));
  const uniqueSamples = samples.filter(
    (card, index) =>
      samples.findIndex(
        (row) =>
          row.number === card.number &&
          Boolean(row.signed) === Boolean(card.signed),
      ) === index,
  );

  const rehearsalCards = RARITIES.map((rarity) => {
    if (rarity === FEATURED_SHOWCASE_CARD.rarity) {
      return {
        name: FEATURED_SHOWCASE_CARD.name,
        number: FEATURED_SHOWCASE_CARD.number,
        imageUrl: FEATURED_SHOWCASE_CARD.imageUrl,
        holoMapUrl: catalog.find((row) => row.number === FEATURED_SHOWCASE_CARD.number)
          ?.holoMapUrl,
        backImageUrl:
          catalog.find((row) => row.number === FEATURED_SHOWCASE_CARD.number)
            ?.backImageUrl ?? ORIGIN_COLLECTION.backImageUrl,
        rarity: FEATURED_SHOWCASE_CARD.rarity,
        holographic: false,
      };
    }
    const card =
      catalog.find((row) => row.rarity === rarity && !row.signed) ??
      SEED_CARDS.find((row) => row.rarity === rarity && !row.signed);
    if (!card) return null;
    const showcase = withCollectionBack(card);
    return {
      name: showcase.name,
      number: showcase.number,
      imageUrl: showcase.imageUrl,
      holoMapUrl: showcase.holoMapUrl,
      backImageUrl: showcase.backImageUrl,
      rarity: showcase.rarity,
      holographic: false,
    };
  }).filter((card): card is NonNullable<typeof card> => Boolean(card));

  return (
    <main className="mx-auto w-full max-w-5xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Dev"
        eyebrow="Foil, signed art, and packs"
      />
      <SanctumSection title="Opening rehearsal" className="mb-16" rule={false}>
        <div className="mx-auto max-w-xl">
          <BoosterOpenDemo
            name={packs[0]?.name ?? "Booster"}
            frontImageUrl={packs[0]?.frontImageUrl}
            backImageUrl={packs[0]?.backImageUrl}
            cards={rehearsalCards}
          />
        </div>
      </SanctumSection>
      <SanctumSection title="Booster packs" className="mb-16" rule={false}>
        <div className="grid gap-8 md:grid-cols-3">
          {packs.map((pack) => (
            <article key={pack.name} className="text-center">
              <BoosterPackPreview
                name={pack.name}
                frontImageUrl={pack.frontImageUrl}
                backImageUrl={pack.backImageUrl}
              />
              <p className="mt-3 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.2em] text-[#d7d3c8]/55 uppercase">
                {pack.name}
              </p>
            </article>
          ))}
        </div>
      </SanctumSection>
      <div className="space-y-16">
        {uniqueSamples.map((card) => (
          <section
            key={`${card.number}-${card.signed ? "signed" : "default"}`}
            className="relative"
          >
            <div className="mb-6 flex flex-col items-center pt-4">
              <h2 className="font-[family-name:var(--font-cormorant)] text-[26px] tracking-wide text-[#cfc6b4] italic md:text-[33px]">
                {formatCardNumber(card.number)} {card.name}
              </h2>
              <div className="mt-3 flex justify-center gap-3">
                <RarityBadge rarity={card.rarity} />
                <MutationBadges signature={Boolean(card.signed)} />
              </div>
            </div>
            <div className="mx-auto grid max-w-2xl grid-cols-2 gap-8">
              {HOLO_VARIANTS.map((variant) => (
                <article key={variant.label} className="space-y-3 text-center">
                  <CardInspect
                    name={card.name}
                    number={card.number}
                    imageUrl={card.imageUrl}
                    holoMapUrl={card.holoMapUrl}
                    backImageUrl={card.backImageUrl}
                    rarity={card.rarity}
                    holographic={variant.holographic}
                    signature={Boolean(card.signed)}
                    glow={false}
                  />
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <p className="font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.18em] text-[#d7d3c8]/55 uppercase">
                      {variant.label}
                    </p>
                    <MutationBadges
                      holographic={variant.holographic}
                      signature={Boolean(card.signed)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

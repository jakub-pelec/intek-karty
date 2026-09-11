import type { Rarity } from "@/db/schema";
import { RARITIES } from "@/lib/constants";
import type { OwnedDeckCard } from "@/lib/game/play-card";
import { CARD_TAGS, type CardTag, type EffectKind } from "@/lib/game/types";

export const DECK_POOL_SORTS = ["points", "rarity", "name"] as const;
export type DeckPoolSort = (typeof DECK_POOL_SORTS)[number];

export type DeckPoolQuery = {
  rarities: Rarity[];
  tags: CardTag[];
  effect: EffectKind | null;
  sort: DeckPoolSort;
};

export const DEFAULT_DECK_POOL_QUERY: DeckPoolQuery = {
  rarities: [],
  tags: [],
  effect: null,
  sort: "points",
};

const RARITY_RANK: Record<Rarity, number> = Object.fromEntries(
  RARITIES.map((rarity, index) => [rarity, index]),
) as Record<Rarity, number>;

function uniqueInOrder<T extends string>(values: T[], order: readonly T[]) {
  return order.filter((item) => values.includes(item));
}

export function toggleDeckRarity(query: DeckPoolQuery, rarity: Rarity): DeckPoolQuery {
  const rarities = query.rarities.includes(rarity)
    ? query.rarities.filter((item) => item !== rarity)
    : uniqueInOrder([...query.rarities, rarity], RARITIES);
  return { ...query, rarities };
}

export function toggleDeckTag(query: DeckPoolQuery, tag: CardTag): DeckPoolQuery {
  const tags = query.tags.includes(tag)
    ? query.tags.filter((item) => item !== tag)
    : uniqueInOrder([...query.tags, tag], CARD_TAGS);
  return { ...query, tags };
}

export function setDeckEffect(
  query: DeckPoolQuery,
  effect: EffectKind | null,
): DeckPoolQuery {
  return { ...query, effect };
}

export function setDeckSort(query: DeckPoolQuery, sort: DeckPoolSort): DeckPoolQuery {
  return { ...query, sort };
}

export function filterDeckPool(
  cards: OwnedDeckCard[],
  query: DeckPoolQuery,
): OwnedDeckCard[] {
  const filtered = cards.filter((card) => {
    if (query.rarities.length && !query.rarities.includes(card.rarity)) return false;
    if (query.tags.length && !query.tags.some((tag) => card.tags.includes(tag))) {
      return false;
    }
    if (query.effect && card.effectKind !== query.effect) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (query.sort === "rarity") {
      return (
        RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
        a.name.localeCompare(b.name) ||
        a.number - b.number
      );
    }
    if (query.sort === "name") {
      return a.name.localeCompare(b.name) || a.number - b.number;
    }
    return (
      b.basePoints - a.basePoints ||
      a.name.localeCompare(b.name) ||
      a.number - b.number
    );
  });
}

export function lineupRarityCounts(cards: OwnedDeckCard[]) {
  const counts = new Map<Rarity, number>();
  for (const card of cards) {
    counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1);
  }
  return RARITIES.flatMap((rarity) => {
    const count = counts.get(rarity) ?? 0;
    return count > 0 ? [{ rarity, count }] : [];
  });
}

export function lineupTagCounts(cards: OwnedDeckCard[]) {
  const counts = new Map<CardTag, number>();
  for (const card of cards) {
    for (const tag of card.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return CARD_TAGS.flatMap((tag) => {
    const count = counts.get(tag) ?? 0;
    return count > 0 ? [{ tag, count }] : [];
  });
}

export function filledSlotCount(slots: (string | null)[]) {
  return slots.filter(Boolean).length;
}

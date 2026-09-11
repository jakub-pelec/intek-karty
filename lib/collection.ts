import type { CardTag } from "@/lib/game/types";
import type { Rarity } from "@/db/schema";
import { RARITIES } from "@/lib/constants";

export const OWNERSHIP_FILTERS = ["all", "owned", "missing"] as const;
export const VARIANT_FILTERS = ["holo", "signed"] as const;
export const COLLECTION_SORTS = ["number", "rarity", "name", "newest"] as const;

export type OwnershipFilter = (typeof OWNERSHIP_FILTERS)[number];
export type VariantFilter = (typeof VARIANT_FILTERS)[number];
export type CollectionSort = (typeof COLLECTION_SORTS)[number];

export type CollectionQuery = {
  set?: string;
  own: OwnershipFilter;
  rarities: Rarity[];
  variants: VariantFilter[];
  sort: CollectionSort;
};

export type CollectionSlot = {
  id: string;
  number: number;
  name: string;
  description: string;
  rarity: Rarity;
  signed: boolean;
  tags: CardTag[];
  basePoints: number;
  effectKind: string | null;
  effectTag: string | null;
  effectValue: number | null;
  effectThreshold: number | null;
  owned: null | {
    id: string;
    name: string;
    description: string;
    rarity: Rarity;
    imageUrl: string | null;
    holoMapUrl?: string | null;
    holographic: boolean;
    signature: boolean;
    acquiredAt: Date | string;
  };
};

const RARITY_RANK: Record<Rarity, number> = Object.fromEntries(
  RARITIES.map((rarity, index) => [rarity, index]),
) as Record<Rarity, number>;

function isRarity(value: string): value is Rarity {
  return (RARITIES as readonly string[]).includes(value);
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function asList(value: string | string[] | undefined) {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
}

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function uniqueInOrder<T extends string>(values: T[], order: readonly T[]) {
  return order.filter((item) => values.includes(item));
}

export function parseCollectionQuery(params: {
  set?: string | string[];
  own?: string | string[];
  rarity?: string | string[];
  variant?: string | string[];
  sort?: string | string[];
}): CollectionQuery {
  const set = first(params.set)?.trim();
  const own = first(params.own);
  const sort = first(params.sort);
  return {
    set: set || undefined,
    own: own && isOneOf(own, OWNERSHIP_FILTERS) ? own : "all",
    rarities: uniqueInOrder(asList(params.rarity).filter(isRarity), RARITIES),
    variants: uniqueInOrder(
      asList(params.variant).filter((value): value is VariantFilter =>
        isOneOf(value, VARIANT_FILTERS),
      ),
      VARIANT_FILTERS,
    ),
    sort: sort && isOneOf(sort, COLLECTION_SORTS) ? sort : "number",
  };
}

export function collectionHref(query: CollectionQuery): string {
  const params = new URLSearchParams();
  if (query.set) params.set("set", query.set);
  if (query.own !== "all") params.set("own", query.own);
  if (query.rarities.length) params.set("rarity", query.rarities.join(","));
  if (query.variants.length) params.set("variant", query.variants.join(","));
  if (query.sort !== "number") params.set("sort", query.sort);
  const search = params.toString();
  return search ? `/collection?${search}` : "/collection";
}

export function toggleRarity(query: CollectionQuery, rarity: Rarity): CollectionQuery {
  const rarities = query.rarities.includes(rarity)
    ? query.rarities.filter((item) => item !== rarity)
    : uniqueInOrder([...query.rarities, rarity], RARITIES);
  return { ...query, rarities };
}

export function toggleVariant(
  query: CollectionQuery,
  variant: VariantFilter,
): CollectionQuery {
  const variants = query.variants.includes(variant)
    ? query.variants.filter((item) => item !== variant)
    : uniqueInOrder([...query.variants, variant], VARIANT_FILTERS);
  return { ...query, variants };
}

function acquiredTime(value: Date | string) {
  return new Date(value).getTime();
}

export function arrangeCollection(
  slots: CollectionSlot[],
  query: CollectionQuery,
) {
  const filtered = slots.filter((slot) => {
    if (query.own === "owned" && !slot.owned) return false;
    if (query.own === "missing" && slot.owned) return false;
    if (query.rarities.length && !query.rarities.includes(slot.rarity)) return false;
    if (query.variants.length) {
      const holo = query.variants.includes("holo") && Boolean(slot.owned?.holographic);
      const signed = query.variants.includes("signed") && slot.signed;
      if (!holo && !signed) return false;
    }
    return true;
  });

  return filtered.sort((a, b) => {
    if (query.sort === "rarity") {
      return (
        RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity] ||
        a.number - b.number ||
        Number(a.signed) - Number(b.signed)
      );
    }
    if (query.sort === "name") {
      if (a.owned && b.owned) return a.name.localeCompare(b.name) || a.number - b.number;
      if (a.owned !== b.owned) return a.owned ? -1 : 1;
      return a.number - b.number;
    }
    if (query.sort === "newest") {
      if (a.owned && b.owned) {
        return acquiredTime(b.owned.acquiredAt) - acquiredTime(a.owned.acquiredAt);
      }
      if (a.owned !== b.owned) return a.owned ? -1 : 1;
      return a.number - b.number;
    }
    return a.number - b.number || Number(a.signed) - Number(b.signed);
  });
}

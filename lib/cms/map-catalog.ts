import type { AchievementCondition, Rarity } from "@/db/schema";
import { RARITIES } from "@/lib/constants";
import { DrawEngineError, assertRatesSumTo100, type DropRate } from "@/lib/draw-engine";
import {
  isCardTag,
  isEffectKind,
  RARITY_BASE_POINTS,
  type CardTag,
  type EffectKind,
} from "@/lib/game/types";

export const CMS_MODELS = [
  "collection",
  "card",
  "booster",
  "achievement",
  "reward",
] as const;

export type CmsModel = (typeof CMS_MODELS)[number];

export type StrapiMedia = { url?: string } | null;

export type StrapiRelation = { documentId?: string; slug?: string } | null;

export type StrapiDropRate = {
  rarity?: string;
  signed?: boolean;
  probabilityPercent?: number;
};

export type StrapiCollection = {
  documentId: string;
  slug?: string;
  name?: string;
  description?: string | null;
  active?: boolean;
  sortOrder?: number;
  backImage?: StrapiMedia;
};

export type StrapiCard = {
  documentId: string;
  number?: number;
  name?: string;
  rarity?: string;
  signed?: boolean;
  active?: boolean;
  image?: StrapiMedia;
  collection?: StrapiRelation;
  basePoints?: number | null;
  tags?: Array<string | { value?: string } | null> | null;
  effectKind?: string | null;
  effectTag?: string | null;
  effectValue?: number | null;
  effectThreshold?: number | null;
};

export type StrapiBooster = {
  documentId: string;
  slug?: string;
  name?: string;
  holographicChancePercent?: number;
  active?: boolean;
  frontImage?: StrapiMedia;
  backImage?: StrapiMedia;
  dropRates?: StrapiDropRate[];
  collection?: StrapiRelation;
};

export type StrapiAchievement = {
  documentId: string;
  slug?: string;
  name?: string;
  description?: string;
  conditionType?: string;
  threshold?: number | null;
  collectionSlug?: string | null;
  pointReward?: number;
  active?: boolean;
};

export type StrapiReward = {
  documentId: string;
  name?: string;
  description?: string;
  pointCost?: number;
  stock?: number | null;
  active?: boolean;
};

const CONDITIONS = new Set<AchievementCondition>([
  "first_booster",
  "first_epic",
  "first_legendary",
  "first_joker",
  "cards_collected_threshold",
  "full_collection",
  "holo_collected_threshold",
  "signed_collected_threshold",
  "signed_holo_collected_threshold",
  "signed_holo_legendary_threshold",
  "collection_first_card",
  "collection_complete",
  "collection_holo_complete",
]);

export class CmsSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CmsSyncError";
  }
}

export function isCmsModel(value: string): value is CmsModel {
  return (CMS_MODELS as readonly string[]).includes(value);
}

export function shouldDeactivate(event: string) {
  return event === "entry.unpublish" || event === "entry.delete";
}

export function nextRetiredNumber(minExisting: number) {
  return Math.min(-1, minExisting - 1);
}

export function isUniqueViolation(error: unknown) {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i += 1) {
    if (
      typeof current === "object" &&
      current &&
      "code" in current &&
      (current as { code?: string }).code === "23505"
    ) {
      return true;
    }
    current =
      typeof current === "object" && current && "cause" in current
        ? (current as { cause?: unknown }).cause
        : null;
  }
  return false;
}

export function uniqueByDocumentId<T extends { documentId: string }>(entries: T[]) {
  const map = new Map<string, T>();
  for (const entry of entries) map.set(entry.documentId, entry);
  return [...map.values()];
}

export function parseCmsWebhookPayload(
  body: unknown,
  eventHeader?: string | null,
) {
  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const entry =
    payload.entry && typeof payload.entry === "object"
      ? (payload.entry as Record<string, unknown>)
      : {};
  return {
    event: String(payload.event ?? eventHeader ?? ""),
    model: String(payload.model ?? ""),
    documentId:
      typeof entry.documentId === "string" ? entry.documentId : undefined,
  };
}

export function mediaUrl(
  strapiUrl: string,
  media: StrapiMedia | undefined,
): string | null {
  const url = media?.url?.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = strapiUrl.replace(/\/$/, "");
  return url.startsWith("/") ? `${origin}${url}` : `${origin}/${url}`;
}

export function cardUniqueKey(
  collectionCmsId: string,
  number: number,
  signed: boolean,
) {
  return `${collectionCmsId}:${number}:${signed}`;
}

export function percentToBp(percent: number) {
  return Math.round(percent * 100);
}

function requireString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new CmsSyncError(`${label} is required`);
  }
  return value.trim();
}

function requireInt(value: unknown, label: string) {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new CmsSyncError(`${label} must be an integer`);
  return n;
}

function isRarity(value: string): value is Rarity {
  return (RARITIES as readonly string[]).includes(value);
}

function mapCardTags(raw: StrapiCard["tags"]): CardTag[] {
  const tags: CardTag[] = [];
  for (const item of raw ?? []) {
    const value =
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? item.value
          : undefined;
    if (!value) continue;
    if (!isCardTag(value)) {
      throw new CmsSyncError(`Unknown card tag: ${value}`);
    }
    if (!tags.includes(value)) tags.push(value);
  }
  return tags;
}

function mapCardEffect(entry: StrapiCard): {
  effectKind: EffectKind | null;
  effectTag: CardTag | null;
  effectValue: number | null;
  effectThreshold: number | null;
} {
  const kindRaw = entry.effectKind?.trim() || "";
  if (!kindRaw) {
    return {
      effectKind: null,
      effectTag: null,
      effectValue: null,
      effectThreshold: null,
    };
  }
  if (!isEffectKind(kindRaw)) {
    throw new CmsSyncError(`Unknown card effect: ${kindRaw}`);
  }
  const tagRaw = entry.effectTag?.trim() || "";
  let effectTag: CardTag | null = null;
  if (tagRaw) {
    if (!isCardTag(tagRaw)) {
      throw new CmsSyncError(`Unknown card effect tag: ${tagRaw}`);
    }
    effectTag = tagRaw;
  }
  if ((kindRaw === "per_tag" || kindRaw === "tribe") && !effectTag) {
    throw new CmsSyncError(`Card effect ${kindRaw} needs an effect tag`);
  }
  const effectValue =
    entry.effectValue === null || entry.effectValue === undefined
      ? 0
      : requireInt(entry.effectValue, "card effectValue");
  if (effectValue < 0) {
    throw new CmsSyncError("card effectValue must be >= 0");
  }
  const effectThreshold =
    kindRaw === "tribe"
      ? entry.effectThreshold === null || entry.effectThreshold === undefined
        ? 3
        : requireInt(entry.effectThreshold, "card effectThreshold")
      : entry.effectThreshold === null || entry.effectThreshold === undefined
        ? null
        : requireInt(entry.effectThreshold, "card effectThreshold");
  if (effectThreshold !== null && effectThreshold < 1) {
    throw new CmsSyncError("card effectThreshold must be >= 1");
  }
  return {
    effectKind: kindRaw,
    effectTag,
    effectValue,
    effectThreshold,
  };
}

export function mapDropRates(rates: StrapiDropRate[] | undefined): DropRate[] {
  const mapped: DropRate[] = (rates ?? [])
    .map((rate) => {
      if (!rate.rarity || !isRarity(rate.rarity)) {
        throw new CmsSyncError(`Unknown drop rarity: ${rate.rarity ?? "(missing)"}`);
      }
      return {
        rarity: rate.rarity,
        signed: Boolean(rate.signed),
        probabilityBp: percentToBp(Number(rate.probabilityPercent ?? 0)),
      };
    })
    .filter((rate) => rate.probabilityBp > 0);
  try {
    assertRatesSumTo100(mapped);
  } catch (error) {
    throw error instanceof DrawEngineError
      ? new CmsSyncError(error.message)
      : error;
  }
  return mapped;
}

export function mapCollection(entry: StrapiCollection, strapiUrl: string) {
  return {
    cmsId: requireString(entry.documentId, "collection documentId"),
    slug: requireString(entry.slug, "collection slug"),
    name: requireString(entry.name, "collection name"),
    description: entry.description?.trim() || null,
    backImageUrl: mediaUrl(strapiUrl, entry.backImage),
    active: entry.active !== false,
    sortOrder: Number.isInteger(entry.sortOrder) ? (entry.sortOrder as number) : 0,
  };
}

export function mapCard(entry: StrapiCard, strapiUrl: string) {
  const collectionCmsId = entry.collection?.documentId;
  if (!collectionCmsId) throw new CmsSyncError("Card is missing a collection");
  if (!entry.rarity || !isRarity(entry.rarity)) {
    throw new CmsSyncError(`Unknown card rarity: ${entry.rarity ?? "(missing)"}`);
  }
  const number = requireInt(entry.number, "card number");
  const signed = Boolean(entry.signed);
  const basePoints =
    entry.basePoints === null || entry.basePoints === undefined
      ? RARITY_BASE_POINTS[entry.rarity]
      : requireInt(entry.basePoints, "card basePoints");
  if (basePoints < 0) {
    throw new CmsSyncError("card basePoints must be >= 0");
  }
  return {
    cmsId: requireString(entry.documentId, "card documentId"),
    collectionCmsId,
    number,
    name: requireString(entry.name, "card name"),
    rarity: entry.rarity,
    signed,
    active: entry.active !== false,
    imageUrl: mediaUrl(strapiUrl, entry.image),
    uniqueKey: cardUniqueKey(collectionCmsId, number, signed),
    basePoints,
    tags: mapCardTags(entry.tags),
    ...mapCardEffect(entry),
  };
}

export function mapBooster(entry: StrapiBooster, strapiUrl: string) {
  const collectionCmsId = entry.collection?.documentId;
  if (!collectionCmsId) throw new CmsSyncError("Booster is missing a collection");
  return {
    cmsId: requireString(entry.documentId, "booster documentId"),
    collectionCmsId,
    slug: requireString(entry.slug, "booster slug"),
    name: requireString(entry.name, "booster name"),
    holographicChanceBp: percentToBp(Number(entry.holographicChancePercent ?? 0)),
    active: entry.active !== false,
    frontImageUrl: mediaUrl(strapiUrl, entry.frontImage),
    backImageUrl: mediaUrl(strapiUrl, entry.backImage),
    rates: mapDropRates(entry.dropRates),
  };
}

export function mapAchievement(entry: StrapiAchievement) {
  const condition = entry.conditionType;
  if (!condition || !CONDITIONS.has(condition as AchievementCondition)) {
    throw new CmsSyncError(`Unknown achievement condition: ${condition ?? "(missing)"}`);
  }
  return {
    cmsId: requireString(entry.documentId, "achievement documentId"),
    slug: requireString(entry.slug, "achievement slug"),
    name: requireString(entry.name, "achievement name"),
    description: requireString(entry.description, "achievement description"),
    conditionType: condition as AchievementCondition,
    threshold:
      entry.threshold === null || entry.threshold === undefined
        ? null
        : requireInt(entry.threshold, "achievement threshold"),
    collectionSlug: entry.collectionSlug?.trim() || null,
    pointReward: requireInt(entry.pointReward ?? 0, "achievement pointReward"),
    active: entry.active !== false,
  };
}

export function mapReward(entry: StrapiReward) {
  return {
    cmsId: requireString(entry.documentId, "reward documentId"),
    name: requireString(entry.name, "reward name"),
    description: requireString(entry.description, "reward description"),
    pointCost: requireInt(entry.pointCost, "reward pointCost"),
    stock:
      entry.stock === null || entry.stock === undefined
        ? null
        : requireInt(entry.stock, "reward stock"),
    active: entry.active !== false,
  };
}

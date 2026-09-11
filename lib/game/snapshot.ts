import { DECK_SIZE } from "@/lib/game/types";
import {
  parseEffectKind,
  parseEffectTag,
  parseGameTags,
  toPlayCard,
  type LineupSnapshotCard,
  type OwnedDeckCard,
} from "@/lib/game/play-card";
import type { Rarity } from "@/db/schema";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "joker"];

function isRarity(value: unknown): value is Rarity {
  return typeof value === "string" && (RARITIES as string[]).includes(value);
}

function parseSnapshotCard(value: unknown): LineupSnapshotCard | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.cardId !== "string" || typeof row.name !== "string") return null;
  if (typeof row.number !== "number" || !isRarity(row.rarity)) return null;
  if (typeof row.basePoints !== "number") return null;
  return {
    cardId: row.cardId,
    number: row.number,
    name: row.name,
    description: typeof row.description === "string" ? row.description : "",
    rarity: row.rarity,
    imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : null,
    holoMapUrl: typeof row.holoMapUrl === "string" ? row.holoMapUrl : null,
    holographic: Boolean(row.holographic),
    signed: Boolean(row.signed),
    tags: parseGameTags(Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : []),
    basePoints: row.basePoints,
    effectKind: parseEffectKind(typeof row.effectKind === "string" ? row.effectKind : null),
    effectTag: parseEffectTag(typeof row.effectTag === "string" ? row.effectTag : null),
    effectValue: typeof row.effectValue === "number" ? row.effectValue : null,
    effectThreshold: typeof row.effectThreshold === "number" ? row.effectThreshold : null,
    backImageUrl: typeof row.backImageUrl === "string" ? row.backImageUrl : null,
  };
}

export function parseLineupSnapshot(value: unknown): LineupSnapshotCard[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseSnapshotCard)
    .filter((card): card is LineupSnapshotCard => Boolean(card))
    .slice(0, DECK_SIZE);
}

export function withBack(
  card: OwnedDeckCard,
  backImageUrl: string | null,
): LineupSnapshotCard {
  return { ...card, backImageUrl };
}

export function snapshotToPlayCards(lineup: LineupSnapshotCard[]) {
  return lineup.map(toPlayCard);
}

import type { Rarity } from "@/db/schema";

export const CARD_TAGS = [
  "chat",
  "hype",
  "raid",
  "food",
  "cat",
  "mod",
  "clutch",
  "night",
  "sub",
  "overlay",
] as const;

export type CardTag = (typeof CARD_TAGS)[number];

export const EFFECT_KINDS = [
  "per_tag",
  "tribe",
  "lone",
  "high_rarity",
] as const;

export type EffectKind = (typeof EFFECT_KINDS)[number];

export const COPY_BONUS = {
  holographic: 2,
  signed: 3,
} as const;

export const RARITY_BASE_POINTS: Record<Rarity, number> = {
  common: 3,
  rare: 5,
  epic: 8,
  legendary: 12,
  joker: 15,
};

export const DECK_SIZE = 6;
export const MAX_DECKS = 8;
export const STARTING_RATING = 1000;
export const RATING_K = 32;
export const PRACTICE_OPPONENT_NAME = "Shade";

export const HIGH_RARITIES = ["epic", "legendary", "joker"] as const;

export type PlayCard = {
  cardId: string;
  name: string;
  rarity: Rarity;
  tags: CardTag[];
  basePoints: number;
  effectKind: EffectKind | null;
  effectTag: CardTag | null;
  effectValue: number | null;
  effectThreshold: number | null;
  holographic: boolean;
  signed: boolean;
};

export type ScoreAlly = {
  cardId: string;
  name: string;
};

export type ScoreNote =
  | { kind: "base"; amount: number }
  | { kind: "copy_holo"; amount: number }
  | { kind: "copy_signed"; amount: number }
  | {
      kind: "per_tag";
      amount: number;
      tag: CardTag;
      per: number;
      allies: ScoreAlly[];
    }
  | { kind: "per_tag_waiting"; tag: CardTag }
  | {
      kind: "tribe";
      amount: number;
      tag: CardTag;
      threshold: number;
      count: number;
      allies: ScoreAlly[];
    }
  | {
      kind: "tribe_waiting";
      tag: CardTag;
      threshold: number;
      count: number;
    }
  | { kind: "lone"; amount: number; tag: CardTag }
  | { kind: "lone_blocked"; tag: CardTag; allies: ScoreAlly[] }
  | {
      kind: "high_rarity";
      amount: number;
      per: number;
      allies: ScoreAlly[];
    };

export type ScoreRow = {
  cardId: string;
  name: string;
  base: number;
  copyBonus: number;
  effect: number;
  subtotal: number;
  notes: ScoreNote[];
};

export type LineupScore = {
  total: number;
  rows: ScoreRow[];
};

export function isCardTag(value: string): value is CardTag {
  return (CARD_TAGS as readonly string[]).includes(value);
}

export function isEffectKind(value: string): value is EffectKind {
  return (EFFECT_KINDS as readonly string[]).includes(value);
}

export function copyBonusFor(card: Pick<PlayCard, "holographic" | "signed">) {
  return (
    (card.holographic ? COPY_BONUS.holographic : 0) +
    (card.signed ? COPY_BONUS.signed : 0)
  );
}

export function primaryTag(card: Pick<PlayCard, "tags" | "effectTag">) {
  return card.effectTag ?? card.tags[0] ?? null;
}

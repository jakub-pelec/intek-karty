import type { Rarity } from "@/db/schema";
import {
  isCardTag,
  isEffectKind,
  type CardTag,
  type EffectKind,
  type PlayCard,
} from "@/lib/game/types";

export type OwnedDeckCard = {
  cardId: string;
  number: number;
  name: string;
  description: string;
  rarity: Rarity;
  imageUrl: string | null;
  holoMapUrl: string | null;
  holographic: boolean;
  signed: boolean;
  tags: CardTag[];
  basePoints: number;
  effectKind: EffectKind | null;
  effectTag: CardTag | null;
  effectValue: number | null;
  effectThreshold: number | null;
};

export type LineupSnapshotCard = OwnedDeckCard & {
  backImageUrl: string | null;
};

export type DeckSummary = {
  id: string;
  name: string;
  isActive: boolean;
  slots: (string | null)[];
};

export function toPlayCard(card: OwnedDeckCard): PlayCard {
  return {
    cardId: card.cardId,
    name: card.name,
    rarity: card.rarity,
    tags: card.tags,
    basePoints: card.basePoints,
    effectKind: card.effectKind,
    effectTag: card.effectTag,
    effectValue: card.effectValue,
    effectThreshold: card.effectThreshold,
    holographic: card.holographic,
    signed: card.signed,
  };
}

export function parseGameTags(raw: string[] | null | undefined): CardTag[] {
  return (raw ?? []).filter(isCardTag);
}

export function parseEffectKind(raw: string | null | undefined): EffectKind | null {
  return raw && isEffectKind(raw) ? raw : null;
}

export function parseEffectTag(raw: string | null | undefined): CardTag | null {
  return raw && isCardTag(raw) ? raw : null;
}

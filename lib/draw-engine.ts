import type { Rarity } from "@/db/schema";
import { DUPLICATE_POINTS } from "@/lib/constants";

export type DropRate = {
  rarity: Rarity;
  signed: boolean;
  probabilityBp: number;
};

export type DropRoll = {
  rarity: Rarity;
  signed: boolean;
};

export class DrawEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawEngineError";
  }
}

export function assertRatesSumTo100(rates: DropRate[]) {
  const sum = rates.reduce((acc, rate) => acc + rate.probabilityBp, 0);
  if (sum !== 10_000) {
    throw new DrawEngineError(
      `Drop rates must sum to 100% (10000 basis points), got ${sum / 100}%`,
    );
  }
}

export function rollDrop(
  rates: DropRate[],
  rng: () => number = Math.random,
): DropRoll {
  if (rates.length === 0) {
    throw new DrawEngineError("Booster has no drop rates");
  }
  assertRatesSumTo100(rates);
  const total = rates.reduce((acc, rate) => acc + rate.probabilityBp, 0);
  let roll = Math.floor(rng() * total);
  for (const rate of rates) {
    if (roll < rate.probabilityBp) {
      return { rarity: rate.rarity, signed: rate.signed };
    }
    roll -= rate.probabilityBp;
  }
  const last = rates[rates.length - 1];
  return { rarity: last.rarity, signed: last.signed };
}

export function inBoosterDrawPool(
  card: { active: boolean; rarity: Rarity; signed: boolean; collectionId: string },
  drop: DropRoll & { collectionId: string },
) {
  return (
    card.active &&
    card.rarity === drop.rarity &&
    card.signed === drop.signed &&
    card.collectionId === drop.collectionId
  );
}

export function filterDrawPool<
  T extends { active: boolean; rarity: Rarity; signed: boolean; collectionId: string },
>(catalog: T[], drop: DropRoll & { collectionId: string }) {
  return catalog.filter((card) => inBoosterDrawPool(card, drop));
}

export function pickCard<T>(cards: T[], rng: () => number = Math.random): T {
  if (cards.length === 0) {
    throw new DrawEngineError("No active cards available for the rolled rarity");
  }
  return cards[Math.floor(rng() * cards.length)];
}

/** Independent mutation roll. `chanceBp` is 0–10000 (0%–100%). */
export function rollMutation(
  chanceBp: number,
  rng: () => number = Math.random,
): boolean {
  const chance = Math.max(0, Math.min(10_000, Math.floor(chanceBp)));
  if (chance <= 0) return false;
  if (chance >= 10_000) return true;
  return Math.floor(rng() * 10_000) < chance;
}

export function duplicatePointsFor(rarity: Rarity) {
  return DUPLICATE_POINTS[rarity];
}

export function rarityDistribution(
  samples: Rarity[],
): Record<Rarity, number> {
  const counts: Record<Rarity, number> = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    joker: 0,
  };
  for (const rarity of samples) counts[rarity] += 1;
  const total = samples.length || 1;
  return {
    common: counts.common / total,
    rare: counts.rare / total,
    epic: counts.epic / total,
    legendary: counts.legendary / total,
    joker: counts.joker / total,
  };
}

export function dropKey(drop: DropRoll) {
  return `${drop.rarity}:${drop.signed ? "signed" : "default"}`;
}

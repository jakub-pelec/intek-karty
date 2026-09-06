import { describe, expect, it } from "vitest";
import { SEED_BOOSTERS } from "@/db/seed-data/boosters";
import { DUPLICATE_POINTS, RARITIES } from "@/lib/constants";
import {
  DrawEngineError,
  assertRatesSumTo100,
  dropKey,
  duplicatePointsFor,
  filterDrawPool,
  pickCard,
  rollDrop,
  rollMutation,
} from "@/lib/draw-engine";

function mulberry32(seed: number) {
  return function rng() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("draw engine", () => {
  it("rejects drop tables that do not sum to 100%", () => {
    expect(() =>
      assertRatesSumTo100([
        { rarity: "common", signed: false, probabilityBp: 5000 },
      ]),
    ).toThrow(DrawEngineError);
  });

  it("keeps the draw pool inside the booster collection", () => {
    const origin = "origin-set";
    const other = "other-set";
    const pool = filterDrawPool(
      [
        {
          id: "keep",
          active: true,
          rarity: "common",
          signed: false,
          collectionId: origin,
        },
        {
          id: "other-set",
          active: true,
          rarity: "common",
          signed: false,
          collectionId: other,
        },
        {
          id: "wrong-rarity",
          active: true,
          rarity: "epic",
          signed: false,
          collectionId: origin,
        },
        {
          id: "inactive",
          active: false,
          rarity: "common",
          signed: false,
          collectionId: origin,
        },
        {
          id: "legacy",
          active: true,
          rarity: "common",
          signed: false,
          collectionId: origin,
          cmsId: null,
        },
      ],
      { rarity: "common", signed: false, collectionId: origin },
    );
    expect(pool.map((card) => card.id)).toEqual(["keep"]);
  });

  it("picks uniformly from the available cards of a rarity", () => {
    const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(pickCard(cards, () => 0).id).toBe("a");
    expect(pickCard(cards, () => 0.99).id).toBe("c");
    expect(() => pickCard([])).toThrow(/No active cards/);
  });

  it("awards the correct duplicate points for every rarity", () => {
    for (const rarity of RARITIES) {
      expect(duplicatePointsFor(rarity)).toBe(DUPLICATE_POINTS[rarity]);
    }
  });

  it("matches configured booster rates within ±2% over 10,000 draws", () => {
    for (const booster of SEED_BOOSTERS) {
      const rng = mulberry32(booster.twitchChannelPointCost);
      const samples = Array.from({ length: 10_000 }, () =>
        rollDrop(booster.rates, rng),
      );
      const observed = new Map<string, number>();
      for (const sample of samples) {
        const key = dropKey(sample);
        observed.set(key, (observed.get(key) ?? 0) + 1);
      }
      for (const rate of booster.rates) {
        const expected = rate.probabilityBp / 10_000;
        const actual = (observed.get(dropKey(rate)) ?? 0) / 10_000;
        expect(
          Math.abs(actual - expected),
          `${booster.slug} ${dropKey(rate)}`,
        ).toBeLessThanOrEqual(0.02);
      }
    }
  });

  it("still returns a card when every card of the rarity is already owned (duplicate path)", () => {
    const pool = [
      { id: "c1", rarity: "common" as const },
      { id: "c2", rarity: "common" as const },
    ];
    const owned = new Set(pool.map((card) => card.id));
    const drawn = pickCard(pool, () => 0.1);
    expect(owned.has(drawn.id)).toBe(true);
    expect(duplicatePointsFor(drawn.rarity)).toBe(2);
  });

  it("never hits a 0% mutation and always hits 100%", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 1_000; i += 1) {
      expect(rollMutation(0, rng)).toBe(false);
      expect(rollMutation(10_000, rng)).toBe(true);
    }
  });

  it("hits a mid-range mutation near the configured rate", () => {
    const rng = mulberry32(7);
    const hits = Array.from({ length: 10_000 }, () => rollMutation(1_250, rng)).filter(
      Boolean,
    ).length;
    expect(hits / 10_000).toBeGreaterThan(0.11);
    expect(hits / 10_000).toBeLessThan(0.14);
  });
});

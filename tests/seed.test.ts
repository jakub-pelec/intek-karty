import { describe, expect, it } from "vitest";
import { SEED_CARDS } from "@/db/seed-data/cards";
import { SEED_BOOSTERS } from "@/db/seed-data/boosters";
import { SEED_ACHIEVEMENTS } from "@/db/seed-data/achievements";
import { ORIGIN_COLLECTION, ORIGIN_COLLECTION_ID } from "@/db/seed-data/collections";
import { SEED_RARITY_COUNTS, TOTAL_CARDS } from "@/lib/constants";

describe("seed catalog", () => {
  it("has exactly 37 unique default card numbers with the required rarity split", () => {
    const defaults = SEED_CARDS.filter((card) => !card.signed);
    expect(defaults).toHaveLength(TOTAL_CARDS);
    const numbers = defaults.map((card) => card.number);
    expect(new Set(numbers).size).toBe(TOTAL_CARDS);
    expect(Math.min(...numbers)).toBe(1);
    expect(Math.max(...numbers)).toBe(TOTAL_CARDS);

    for (const [rarity, count] of Object.entries(SEED_RARITY_COUNTS)) {
      expect(
        defaults.filter((card) => card.rarity === rarity),
        rarity,
      ).toHaveLength(count);
    }

    const signed = SEED_CARDS.filter((card) => card.signed);
    expect(signed).toHaveLength(1);
    expect(signed[0]?.number).toBe(4);
    expect(
      new Set(SEED_CARDS.map((card) => `${card.number}:${card.signed ?? false}`))
        .size,
    ).toBe(SEED_CARDS.length);
    expect(ORIGIN_COLLECTION.slug).toBe("origin");
    expect(ORIGIN_COLLECTION.name).toBe("Origin");
    expect(ORIGIN_COLLECTION.backImageUrl).toBe("/collections/origin-back.svg");
    const keys = SEED_CARDS.map(
      (card) =>
        `${ORIGIN_COLLECTION_ID}:${card.number}:${card.signed ?? false}`,
    );
    expect(new Set(keys).size).toBe(SEED_CARDS.length);
    expect(`${ORIGIN_COLLECTION_ID}:1:false`).not.toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:1:false",
    );
  });

  it("seeds three boosters whose rates sum to 100%", () => {
    expect(SEED_BOOSTERS).toHaveLength(3);
    for (const booster of SEED_BOOSTERS) {
      const sum = booster.rates.reduce((acc, rate) => acc + rate.probabilityBp, 0);
      expect(sum, booster.slug).toBe(10_000);
    }
    expect(SEED_BOOSTERS.map((b) => b.twitchChannelPointCost)).toEqual([
      4000, 8000, 16767,
    ]);
    expect(SEED_BOOSTERS.map((b) => b.holographicChanceBp)).toEqual([
      300, 800, 1200,
    ]);
    for (const booster of SEED_BOOSTERS) {
      expect(booster.frontImageUrl).toBe(`/boosters/${booster.slug}-front.png`);
      expect(booster.backImageUrl).toBe(`/boosters/${booster.slug}-back.png`);
    }
  });

  it("seeds the six MVP achievements", () => {
    expect(SEED_ACHIEVEMENTS).toHaveLength(6);
    expect(SEED_ACHIEVEMENTS.map((a) => a.conditionType).sort()).toEqual(
      [
        "cards_collected_threshold",
        "first_booster",
        "first_epic",
        "first_joker",
        "first_legendary",
        "full_collection",
      ].sort(),
    );
  });
});

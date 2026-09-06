import type { Rarity } from "@/db/schema";
import { describe, expect, it } from "vitest";
import { achievementConditionMet } from "@/db/queries/achievements";

describe("achievement conditions", () => {
  const empty = {
    drawCount: 0,
    ownedCount: 0,
    ownedRarities: [] as Rarity[],
  };

  it("unlocks first booster only after a draw", () => {
    expect(achievementConditionMet("first_booster", null, empty)).toBe(false);
    expect(
      achievementConditionMet("first_booster", null, { ...empty, drawCount: 1 }),
    ).toBe(true);
  });

  it("unlocks rarity achievements from owned cards", () => {
    expect(achievementConditionMet("first_epic", null, empty)).toBe(false);
    expect(
      achievementConditionMet("first_epic", null, {
        ...empty,
        ownedCount: 1,
        ownedRarities: ["epic"],
      }),
    ).toBe(true);
    expect(
      achievementConditionMet("first_legendary", null, {
        ...empty,
        ownedRarities: ["legendary"],
      }),
    ).toBe(true);
    expect(
      achievementConditionMet("first_joker", null, {
        ...empty,
        ownedRarities: ["joker"],
      }),
    ).toBe(true);
  });

  it("unlocks collection thresholds", () => {
    expect(
      achievementConditionMet("cards_collected_threshold", 10, {
        ...empty,
        ownedCount: 9,
      }),
    ).toBe(false);
    expect(
      achievementConditionMet("cards_collected_threshold", 10, {
        ...empty,
        ownedCount: 10,
      }),
    ).toBe(true);
    expect(
      achievementConditionMet("full_collection", 37, {
        ...empty,
        ownedCount: 37,
      }),
    ).toBe(true);
    expect(
      achievementConditionMet("full_collection", null, {
        ...empty,
        ownedCount: 10,
        catalogCount: 50,
        completedACollection: true,
      }),
    ).toBe(true);
    expect(
      achievementConditionMet("full_collection", null, {
        ...empty,
        ownedCount: 10,
        catalogCount: 50,
        completedACollection: false,
      }),
    ).toBe(false);
  });

  it("stays met when re-evaluated (idempotency is enforced by unique grant)", () => {
    const state = { drawCount: 4, ownedCount: 37, ownedRarities: ["joker" as const] };
    expect(achievementConditionMet("first_booster", null, state)).toBe(true);
    expect(achievementConditionMet("first_booster", null, state)).toBe(true);
    expect(achievementConditionMet("full_collection", 37, state)).toBe(true);
  });
});

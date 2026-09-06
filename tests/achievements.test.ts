import type { Rarity } from "@/db/schema";
import { describe, expect, it } from "vitest";
import {
  achievementConditionMet,
  achievementProgress,
} from "@/db/queries/achievements";

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

  it("unlocks holo, signed, and set-scoped titles", () => {
    const state = {
      ...empty,
      holoCount: 10,
      signedCount: 3,
      signedHoloCount: 2,
      signedHoloLegendaryCount: 1,
      collectionOwned: { nyappoleon: 4 },
      collectionNeeded: { nyappoleon: 4 },
      collectionHoloOwned: { nyappoleon: 4 },
    };
    expect(achievementConditionMet("holo_collected_threshold", 10, state)).toBe(true);
    expect(achievementConditionMet("holo_collected_threshold", 11, state)).toBe(false);
    expect(achievementConditionMet("signed_collected_threshold", 3, state)).toBe(true);
    expect(achievementConditionMet("signed_holo_collected_threshold", 2, state)).toBe(true);
    expect(
      achievementConditionMet("signed_holo_legendary_threshold", 1, state),
    ).toBe(true);
    expect(achievementConditionMet("collection_first_card", 1, state, "nyappoleon")).toBe(
      true,
    );
    expect(achievementConditionMet("collection_complete", null, state, "nyappoleon")).toBe(
      true,
    );
    expect(
      achievementConditionMet("collection_holo_complete", null, state, "nyappoleon"),
    ).toBe(true);
    expect(achievementConditionMet("collection_complete", null, state, "other")).toBe(
      false,
    );
  });

  it("reports current and required progress", () => {
    const state = {
      ...empty,
      ownedCount: 7,
      ownedRarities: ["joker" as const],
      holoCount: 3,
      signedCount: 1,
      collectionOwned: { nyappoleon: 2 },
      collectionNeeded: { nyappoleon: 4 },
      collectionHoloOwned: { nyappoleon: 1 },
    };
    expect(achievementProgress("cards_collected_threshold", 10, state)).toEqual({
      current: 7,
      required: 10,
    });
    expect(achievementProgress("holo_collected_threshold", 10, state)).toEqual({
      current: 3,
      required: 10,
    });
    expect(achievementProgress("first_joker", null, state)).toEqual({
      current: 1,
      required: 1,
    });
    expect(achievementProgress("collection_complete", null, state, "nyappoleon")).toEqual({
      current: 2,
      required: 4,
    });
    expect(
      achievementProgress("collection_holo_complete", null, state, "nyappoleon"),
    ).toEqual({ current: 1, required: 4 });
  });
});

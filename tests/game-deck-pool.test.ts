import { describe, expect, it } from "vitest";
import type { OwnedDeckCard } from "@/lib/game/play-card";
import {
  DEFAULT_DECK_POOL_QUERY,
  filterDeckPool,
  filledSlotCount,
  lineupRarityCounts,
  lineupTagCounts,
  setDeckEffect,
  setDeckSort,
  toggleDeckRarity,
  toggleDeckTag,
} from "@/lib/game/deck-pool";

function card(
  extra: Partial<OwnedDeckCard> & Pick<OwnedDeckCard, "cardId" | "name" | "rarity">,
): OwnedDeckCard {
  return {
    number: 1,
    description: "",
    imageUrl: null,
    holoMapUrl: null,
    holographic: false,
    signed: false,
    tags: [],
    basePoints: 3,
    effectKind: null,
    effectTag: null,
    effectValue: null,
    effectThreshold: null,
    ...extra,
  };
}

const snack = card({
  cardId: "snack",
  name: "Snack",
  rarity: "common",
  tags: ["food"],
  basePoints: 3,
});
const commander = card({
  cardId: "cmd",
  name: "Commander",
  rarity: "rare",
  tags: ["chat"],
  basePoints: 5,
  effectKind: "tribe",
  effectTag: "chat",
  effectValue: 4,
  effectThreshold: 3,
});
const cat = card({
  cardId: "cat",
  name: "Cat",
  rarity: "joker",
  tags: ["cat", "food"],
  basePoints: 15,
  effectKind: "per_tag",
  effectTag: "food",
  effectValue: 2,
});
const pool = [snack, commander, cat];

describe("filterDeckPool", () => {
  it("returns every relic sorted by points when filters are Any", () => {
    expect(filterDeckPool(pool, DEFAULT_DECK_POOL_QUERY).map((item) => item.cardId)).toEqual([
      "cat",
      "cmd",
      "snack",
    ]);
  });

  it("keeps rarities that match any selected chip", () => {
    const query = toggleDeckRarity(
      toggleDeckRarity(DEFAULT_DECK_POOL_QUERY, "common"),
      "rare",
    );
    expect(filterDeckPool(pool, query).map((item) => item.cardId)).toEqual(["cmd", "snack"]);
  });

  it("keeps relics that carry any selected type", () => {
    const query = toggleDeckTag(DEFAULT_DECK_POOL_QUERY, "food");
    expect(filterDeckPool(pool, query).map((item) => item.cardId)).toEqual(["cat", "snack"]);
  });

  it("keeps relics with the selected effect", () => {
    const query = setDeckEffect(DEFAULT_DECK_POOL_QUERY, "tribe");
    expect(filterDeckPool(pool, query).map((item) => item.cardId)).toEqual(["cmd"]);
  });

  it("orders A–Z by name", () => {
    const query = setDeckSort(DEFAULT_DECK_POOL_QUERY, "name");
    expect(filterDeckPool(pool, query).map((item) => item.name)).toEqual([
      "Cat",
      "Commander",
      "Snack",
    ]);
  });

  it("orders rarity from common to joker", () => {
    const query = setDeckSort(DEFAULT_DECK_POOL_QUERY, "rarity");
    expect(filterDeckPool(pool, query).map((item) => item.rarity)).toEqual([
      "common",
      "rare",
      "joker",
    ]);
  });
});

describe("toggleDeckRarity", () => {
  it("clears back to Any when the last rarity is turned off", () => {
    const on = toggleDeckRarity(DEFAULT_DECK_POOL_QUERY, "epic");
    expect(on.rarities).toEqual(["epic"]);
    expect(toggleDeckRarity(on, "epic").rarities).toEqual([]);
  });
});

describe("lineup summaries", () => {
  it("counts rarities and types in catalog order", () => {
    expect(lineupRarityCounts([snack, commander, cat])).toEqual([
      { rarity: "common", count: 1 },
      { rarity: "rare", count: 1 },
      { rarity: "joker", count: 1 },
    ]);
    expect(lineupTagCounts([snack, cat])).toEqual([
      { tag: "food", count: 2 },
      { tag: "cat", count: 1 },
    ]);
  });

  it("counts filled slots", () => {
    expect(filledSlotCount(["a", null, "b", null, null, "c"])).toBe(3);
  });
});

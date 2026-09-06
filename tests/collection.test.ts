import { describe, expect, it } from "vitest";
import {
  arrangeCollection,
  collectionHref,
  parseCollectionQuery,
  toggleRarity,
  type CollectionSlot,
} from "@/lib/collection";

function slot(
  partial: Partial<CollectionSlot> & Pick<CollectionSlot, "id" | "number">,
): CollectionSlot {
  return {
    name: partial.name ?? `Card ${partial.number}`,
    rarity: partial.rarity ?? "common",
    signed: partial.signed ?? false,
    owned: partial.owned ?? null,
    ...partial,
  };
}

const owned = (
  id: string,
  extra: Partial<NonNullable<CollectionSlot["owned"]>> = {},
): NonNullable<CollectionSlot["owned"]> => ({
  id,
  name: extra.name ?? id,
  description: "",
  rarity: extra.rarity ?? "common",
  imageUrl: null,
  holographic: extra.holographic ?? false,
  signature: extra.signature ?? false,
  acquiredAt: extra.acquiredAt ?? "2026-01-01",
});

describe("parseCollectionQuery", () => {
  it("falls back to defaults", () => {
    expect(parseCollectionQuery({})).toEqual({
      set: undefined,
      own: "all",
      rarities: [],
      variants: [],
      sort: "number",
    });
  });

  it("reads several rarities", () => {
    expect(parseCollectionQuery({ rarity: "rare,common,mythic" })).toMatchObject({
      rarities: ["common", "rare"],
    });
    expect(parseCollectionQuery({ rarity: ["epic", "rare"] })).toMatchObject({
      rarities: ["rare", "epic"],
    });
  });

  it("ignores unknown values", () => {
    expect(
      parseCollectionQuery({ own: "nope", rarity: "mythic", sort: "price" }),
    ).toEqual({
      set: undefined,
      own: "all",
      rarities: [],
      variants: [],
      sort: "number",
    });

    expect(parseCollectionQuery({ set: "origin" })).toMatchObject({
      set: "origin",
    });
  });
});

describe("collectionHref", () => {
  it("omits default params", () => {
    expect(
      collectionHref({ own: "all", rarities: [], variants: [], sort: "number" }),
    ).toBe("/collection");
  });

  it("keeps active filters", () => {
    expect(
      collectionHref({
        own: "owned",
        rarities: ["common", "rare"],
        variants: ["holo"],
        sort: "newest",
      }),
    ).toBe("/collection?own=owned&rarity=common%2Crare&variant=holo&sort=newest");
  });

  it("keeps the set with existing filters", () => {
    expect(
      collectionHref({
        set: "origin",
        own: "owned",
        rarities: ["common", "rare"],
        variants: ["holo"],
        sort: "newest",
      }),
    ).toBe(
      "/collection?set=origin&own=owned&rarity=common%2Crare&variant=holo&sort=newest",
    );
  });
});

describe("toggleRarity", () => {
  const base = parseCollectionQuery({});

  it("adds and removes a rarity", () => {
    const withRare = toggleRarity(base, "rare");
    expect(withRare.rarities).toEqual(["rare"]);
    expect(toggleRarity(withRare, "common").rarities).toEqual(["common", "rare"]);
    expect(toggleRarity(withRare, "rare").rarities).toEqual([]);
  });
});

describe("arrangeCollection", () => {
  const slots = [
    slot({
      id: "1",
      number: 2,
      name: "Beta",
      rarity: "rare",
      owned: owned("1", { name: "Beta", rarity: "rare", acquiredAt: "2026-02-01" }),
    }),
    slot({
      id: "2",
      number: 1,
      name: "Alpha",
      rarity: "legendary",
      signed: true,
      owned: owned("2", {
        name: "Alpha",
        rarity: "legendary",
        holographic: true,
        signature: true,
        acquiredAt: "2026-03-01",
      }),
    }),
    slot({ id: "3", number: 3, name: "Gamma", rarity: "common" }),
  ];

  const base = parseCollectionQuery({});

  it("keeps several rarities", () => {
    const visible = arrangeCollection(slots, {
      ...base,
      rarities: ["common", "rare"],
    });
    expect(visible.map((row) => row.id)).toEqual(["1", "3"]);
  });

  it("filters bound holo cards", () => {
    const visible = arrangeCollection(slots, {
      ...base,
      own: "owned",
      variants: ["holo"],
    });
    expect(visible.map((row) => row.id)).toEqual(["2"]);
  });

  it("sorts newest bound first", () => {
    const visible = arrangeCollection(slots, { ...base, own: "owned", sort: "newest" });
    expect(visible.map((row) => row.id)).toEqual(["2", "1"]);
  });

  it("sorts rarity then number", () => {
    const visible = arrangeCollection(slots, { ...base, sort: "rarity" });
    expect(visible.map((row) => row.id)).toEqual(["3", "1", "2"]);
  });
});

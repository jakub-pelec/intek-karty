import { describe, expect, it } from "vitest";
import { isLiveCmsRow } from "@/lib/cms/live";
import {
  cardUniqueKey,
  mapBooster,
  mapCard,
  mapCollection,
  mapDropRates,
  mapReward,
  mediaUrl,
  isUniqueViolation,
  nextRetiredNumber,
  parseCmsWebhookPayload,
  percentToBp,
  shouldDeactivate,
  uniqueByDocumentId,
} from "@/lib/cms/map-catalog";
import { packHoloChannels } from "@/lib/holo-map";

describe("cms mapper", () => {
  it("builds absolute media URLs", () => {
    expect(mediaUrl("http://localhost:1337", { url: "/uploads/card.png" })).toBe(
      "http://localhost:1337/uploads/card.png",
    );
    expect(mediaUrl("http://localhost:1337/", { url: "https://cdn.example/a.png" })).toBe(
      "https://cdn.example/a.png",
    );
    expect(mediaUrl("http://localhost:1337", null)).toBeNull();
  });

  it("keeps uniqueness per collection", () => {
    expect(cardUniqueKey("origin", 1, false)).not.toBe(cardUniqueKey("other", 1, false));
    expect(cardUniqueKey("origin", 1, false)).not.toBe(cardUniqueKey("origin", 1, true));
  });

  it("converts percents to basis points and rejects rates that do not sum to 100", () => {
    expect(percentToBp(12.5)).toBe(1250);
    expect(
      mapDropRates([
        { rarity: "common", signed: false, probabilityPercent: 64 },
        { rarity: "common", signed: true, probabilityPercent: 1 },
        { rarity: "rare", signed: false, probabilityPercent: 25 },
        { rarity: "epic", signed: false, probabilityPercent: 8 },
        { rarity: "legendary", signed: false, probabilityPercent: 2 },
      ]).reduce((sum, rate) => sum + rate.probabilityBp, 0),
    ).toBe(10_000);
    expect(() =>
      mapDropRates([{ rarity: "common", signed: false, probabilityPercent: 50 }]),
    ).toThrow(/100%/);
  });

  it("maps collection, card, booster, and reward entries", () => {
    const collection = mapCollection(
      {
        documentId: "col1",
        slug: "origin",
        name: "Origin",
        description: "The first binder.",
        active: true,
        sortOrder: 0,
        backImage: { url: "/uploads/origin-back.png" },
      },
      "http://cms.test",
    );
    expect(collection.cmsId).toBe("col1");
    expect(collection.slug).toBe("origin");
    expect(collection.backImageUrl).toBe("http://cms.test/uploads/origin-back.png");

    const card = mapCard(
      {
        documentId: "card1",
        number: 4,
        name: "Ember",
        lore: "A spark.",
        rarity: "rare",
        signed: true,
        image: { url: "/uploads/ember.png" },
        holoMap: { url: "/uploads/ember-holo.png" },
        collection: { documentId: "col1" },
      },
      "http://cms.test",
    );
    expect(card.uniqueKey).toBe("col1:4:true");
    expect(card.imageUrl).toBe("http://cms.test/uploads/ember.png");
    expect(card.holoMapUrl).toBe("http://cms.test/uploads/ember-holo.png");
    expect(card.description).toBe("A spark.");

    const booster = mapBooster(
      {
        documentId: "b1",
        slug: "booster",
        name: "Booster",
        twitchChannelPointCost: 4000,
        holographicChancePercent: 3,
        collection: { documentId: "col1" },
        dropRates: [
          { rarity: "common", signed: false, probabilityPercent: 100 },
        ],
      },
      "http://cms.test",
    );
    expect(booster.holographicChanceBp).toBe(300);
    expect(booster.rates).toEqual([
      { rarity: "common", signed: false, probabilityBp: 10_000 },
    ]);

    expect(
      mapReward({
        documentId: "r1",
        name: "Shout-out",
        description: "On stream",
        pointCost: 50,
        stock: null,
      }).stock,
    ).toBeNull();
  });

  it("treats only published CMS rows as live catalog", () => {
    expect(isLiveCmsRow({ active: true, cmsId: "card1" })).toBe(true);
    expect(isLiveCmsRow({ active: false, cmsId: "card1" })).toBe(false);
    expect(isLiveCmsRow({ active: true, cmsId: null })).toBe(false);
    expect(isLiveCmsRow({ active: true, cmsId: "" })).toBe(false);
  });

  it("treats unpublish and delete as deactivate", () => {
    expect(shouldDeactivate("entry.unpublish")).toBe(true);
    expect(shouldDeactivate("entry.delete")).toBe(true);
    expect(shouldDeactivate("entry.publish")).toBe(false);
  });

  it("assigns a unique negative number when retiring a leftover card", () => {
    expect(nextRetiredNumber(666)).toBe(-1);
    expect(nextRetiredNumber(-1)).toBe(-2);
    expect(nextRetiredNumber(-666)).toBe(-667);
  });

  it("detects Postgres unique violations through wrapped errors", () => {
    expect(isUniqueViolation({ cause: { code: "23505" } })).toBe(true);
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });

  it("keeps one row per Strapi document id", () => {
    expect(
      uniqueByDocumentId([
        { documentId: "a", name: "first" },
        { documentId: "a", name: "second" },
        { documentId: "b", name: "other" },
      ]).map((row) => row.name),
    ).toEqual(["second", "other"]);
  });

  it("reads Strapi webhook fields from the body or event header", () => {
    expect(
      parseCmsWebhookPayload({
        event: "entry.publish",
        model: "card",
        entry: { documentId: "card1" },
      }),
    ).toEqual({
      event: "entry.publish",
      model: "card",
      documentId: "card1",
    });
    expect(parseCmsWebhookPayload(null, "entry.update")).toEqual({
      event: "entry.update",
      model: "",
      documentId: undefined,
    });
    expect(parseCmsWebhookPayload({ event: "entry.publish", entry: null })).toEqual({
      event: "entry.publish",
      model: "",
      documentId: undefined,
    });
  });
});

describe("holo channel packer", () => {
  it("writes a foil mask on R and Sobel X/Y on G/B", () => {
    const white = packHoloChannels(
      new Uint8Array([
        255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255,
      ]),
      2,
      2,
    );
    expect(white[0]).toBe(115);
    expect(white[1]).toBe(128);
    expect(white[2]).toBe(128);

    const black = packHoloChannels(
      new Uint8Array([
        0, 0, 0, 255, 0, 0, 0, 255,
        0, 0, 0, 255, 0, 0, 0, 255,
      ]),
      2,
      2,
    );
    expect(black[0]).toBe(0);
    expect(black[1]).toBe(128);

    const gradient = packHoloChannels(
      new Uint8Array([
        0, 0, 0, 255, 255, 255, 255, 255,
        0, 0, 0, 255, 255, 255, 255, 255,
      ]),
      2,
      2,
    );
    expect(gradient[0]).toBeGreaterThan(white[0]);
    expect(gradient[1]).toBeGreaterThan(128);
    expect(gradient[4]).toBeGreaterThan(128);
    expect(gradient[2]).toBe(128);
    expect(gradient[5]).toBe(128);
  });
});

import { describe, expect, it } from "vitest";
import { scoreLineup } from "@/lib/game/score";
import type { PlayCard } from "@/lib/game/types";

function card(
  id: string,
  extra: Partial<PlayCard> & Pick<PlayCard, "name" | "rarity" | "basePoints">,
): PlayCard {
  return {
    cardId: id,
    tags: [],
    effectKind: null,
    effectTag: null,
    effectValue: null,
    effectThreshold: null,
    holographic: false,
    signed: false,
    ...extra,
  };
}

describe("scoreLineup", () => {
  it("adds cat per_tag food bonuses for other revealed allies", () => {
    const cat = card("cat", {
      name: "Cat",
      rarity: "joker",
      basePoints: 15,
      tags: ["cat"],
      effectKind: "per_tag",
      effectTag: "food",
      effectValue: 2,
    });
    const snack = card("food-a", {
      name: "Snack",
      rarity: "common",
      basePoints: 3,
      tags: ["food"],
    });
    const water = card("food-b", {
      name: "Water",
      rarity: "common",
      basePoints: 3,
      tags: ["food"],
    });
    const chat = card("chat", {
      name: "Chat",
      rarity: "common",
      basePoints: 3,
      tags: ["chat"],
    });
    const scored = scoreLineup([cat, snack, water, chat]);
    expect(scored.rows.find((row) => row.cardId === "cat")?.effect).toBe(4);
    expect(scored.total).toBe(15 + 4 + 3 + 3 + 3);
    expect(scored.rows.find((row) => row.cardId === "cat")?.notes).toEqual(
      expect.arrayContaining([
        { kind: "base", amount: 15 },
        {
          kind: "per_tag",
          amount: 4,
          tag: "food",
          per: 2,
          allies: [
            { cardId: "food-a", name: "Snack" },
            { cardId: "food-b", name: "Water" },
          ],
        },
      ]),
    );
  });

  it("pays tribe only once the threshold is met among revealed cards", () => {
    const commander = card("cmd", {
      name: "Commander",
      rarity: "rare",
      basePoints: 5,
      tags: ["chat"],
      effectKind: "tribe",
      effectTag: "chat",
      effectValue: 4,
      effectThreshold: 3,
    });
    const a = card("a", {
      name: "A",
      rarity: "common",
      basePoints: 3,
      tags: ["chat"],
    });
    const b = card("b", {
      name: "B",
      rarity: "common",
      basePoints: 3,
      tags: ["chat"],
    });
    expect(scoreLineup([commander, a], 2).rows[0]?.effect).toBe(0);
    expect(scoreLineup([commander, a, b], 3).rows[0]?.effect).toBe(4);
  });

  it("pays lone only when no other revealed ally shares the tag", () => {
    const mod = card("mod", {
      name: "Mod",
      rarity: "rare",
      basePoints: 5,
      tags: ["mod"],
      effectKind: "lone",
      effectTag: "mod",
      effectValue: 3,
    });
    const other = card("other", {
      name: "Other",
      rarity: "common",
      basePoints: 3,
      tags: ["chat"],
    });
    const twin = card("twin", {
      name: "Twin",
      rarity: "common",
      basePoints: 3,
      tags: ["mod"],
    });
    expect(scoreLineup([mod, other]).rows[0]?.effect).toBe(3);
    expect(scoreLineup([mod, twin]).rows[0]?.effect).toBe(0);
  });

  it("adds holo and signed copy bonuses", () => {
    const relic = card("relic", {
      name: "Relic",
      rarity: "common",
      basePoints: 3,
      holographic: true,
      signed: true,
    });
    const scored = scoreLineup([relic]);
    expect(scored.rows[0]).toMatchObject({
      base: 3,
      copyBonus: 5,
      effect: 0,
      subtotal: 8,
    });
  });

  it("counts high_rarity among revealed cards including self", () => {
    const engine = card("engine", {
      name: "Engine",
      rarity: "epic",
      basePoints: 8,
      tags: ["hype"],
      effectKind: "high_rarity",
      effectValue: 2,
    });
    const legend = card("legend", {
      name: "Legend",
      rarity: "legendary",
      basePoints: 12,
    });
    const common = card("common", {
      name: "Common",
      rarity: "common",
      basePoints: 3,
    });
    expect(scoreLineup([engine, legend, common]).rows[0]?.effect).toBe(4);
  });

  it("scores only the revealed prefix", () => {
    const cat = card("cat", {
      name: "Cat",
      rarity: "joker",
      basePoints: 15,
      tags: ["cat"],
      effectKind: "per_tag",
      effectTag: "food",
      effectValue: 2,
    });
    const food = card("food", {
      name: "Food",
      rarity: "common",
      basePoints: 3,
      tags: ["food"],
    });
    const hidden = scoreLineup([cat, food], 1);
    expect(hidden.rows).toHaveLength(1);
    expect(hidden.rows[0]?.effect).toBe(0);
    expect(hidden.total).toBe(15);
    const shown = scoreLineup([cat, food], 2);
    expect(shown.rows[0]?.effect).toBe(2);
    expect(shown.total).toBe(20);
  });
});

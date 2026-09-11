import { describe, expect, it } from "vitest";
import type { LineupSnapshotCard } from "@/lib/game/play-card";
import {
  buildMatchPayload,
  canViewMatch,
  viewMatch,
  type MatchRecord,
} from "@/lib/game/view-match";

function relic(id: string, name: string): LineupSnapshotCard {
  return {
    cardId: id,
    number: 1,
    name,
    description: "",
    rarity: "common",
    imageUrl: `/${id}.png`,
    holoMapUrl: null,
    holographic: false,
    signed: false,
    tags: ["chat"],
    basePoints: 3,
    effectKind: null,
    effectTag: null,
    effectValue: null,
    effectThreshold: null,
    backImageUrl: "/back.png",
  };
}

const lineupA = ["a1", "a2", "a3", "a4", "a5", "a6"].map((id) => relic(id, id));
const lineupB = ["b1", "b2", "b3", "b4", "b5", "b6"].map((id) => relic(id, id));

const match: MatchRecord = {
  id: "m1",
  kind: "ranked",
  status: "revealing",
  revealedCount: 2,
  playerAId: "alice",
  playerBId: "bob",
  playerAName: "Alice",
  playerBName: "Bob",
  playerARating: 1000,
  playerBRating: 1020,
  playerALineup: lineupA,
  playerBLineup: lineupB,
  winnerSide: null,
  ratingDeltaA: null,
  ratingDeltaB: null,
};

describe("viewMatch", () => {
  it("hides unrevealed cards from both sides", () => {
    const view = viewMatch(match, { id: "alice", role: "viewer" });
    expect(view.playerA.slots.filter((slot) => slot.card).map((slot) => slot.card?.name)).toEqual([
      "a1",
      "a2",
    ]);
    expect(view.playerB.slots.filter((slot) => slot.card).map((slot) => slot.card?.name)).toEqual([
      "b1",
      "b2",
    ]);
    expect(view.playerA.slots[0]?.row?.subtotal).toBe(3);
    expect(view.playerA.slots[2]?.card).toBeNull();
    expect(view.playerA.slots[2]?.row).toBeNull();
    expect(view.playerB.slots[5]?.backImageUrl).toBe("/back.png");
  });

  it("god view shows the full lineups", () => {
    const view = viewMatch(match, { id: "alice", role: "admin" }, true);
    expect(view.playerB.slots.every((slot) => slot.card)).toBe(true);
    expect(view.playerB.slots[5]?.card?.name).toBe("b6");
  });

  it("scores only the revealed prefix", () => {
    const view = viewMatch(match, { id: "alice", role: "viewer" });
    expect(view.playerA.score).toBe(6);
    expect(view.playerB.score).toBe(6);
  });

  it("keeps ranked god payload off the public client", () => {
    const payload = buildMatchPayload(match, { id: "alice", role: "viewer" });
    expect(payload.god).toBeNull();
    expect(payload.canDevControl).toBe(false);
    expect(payload.canReveal).toBe(true);
  });

  it("gives practice owners god and rewind controls", () => {
    const practice: MatchRecord = { ...match, kind: "practice", playerBId: null };
    const payload = buildMatchPayload(practice, { id: "alice", role: "viewer" });
    expect(payload.god).not.toBeNull();
    expect(payload.canDevControl).toBe(true);
  });

  it("blocks strangers from viewing", () => {
    expect(canViewMatch(match, { id: "eve", role: "viewer" })).toBe(false);
    expect(canViewMatch(match, { id: "eve", role: "admin" })).toBe(true);
  });
});

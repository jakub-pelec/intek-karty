import { describe, expect, it } from "vitest";
import { pickClosestOpponent } from "@/lib/game/matchmaking";

describe("pickClosestOpponent", () => {
  it("picks the nearest rating and breaks ties by id", () => {
    const pick = pickClosestOpponent("me", 1000, [
      { id: "far", rating: 1400 },
      { id: "b", rating: 1100 },
      { id: "a", rating: 1100 },
    ]);
    expect(pick?.id).toBe("a");
  });

  it("ignores the challenger", () => {
    const pick = pickClosestOpponent("me", 1000, [
      { id: "me", rating: 1000 },
      { id: "other", rating: 1800 },
    ]);
    expect(pick?.id).toBe("other");
  });

  it("returns null when nobody else is queue-ready", () => {
    expect(pickClosestOpponent("me", 1000, [{ id: "me", rating: 1000 }])).toBeNull();
  });
});

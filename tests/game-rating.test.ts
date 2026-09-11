import { describe, expect, it } from "vitest";
import { expectedScore, ratingDelta, ratingPair, winnerFromScores } from "@/lib/game/rating";

describe("rating", () => {
  it("gives even players +16 / -16 on a decisive result", () => {
    expect(ratingPair(1000, 1000, "a")).toEqual({ deltaA: 16, deltaB: -16 });
    expect(ratingPair(1000, 1000, "b")).toEqual({ deltaA: -16, deltaB: 16 });
  });

  it("gives even players zero on a draw", () => {
    expect(ratingPair(1000, 1000, "draw")).toEqual({ deltaA: 0, deltaB: 0 });
  });

  it("moves less when the favorite wins", () => {
    const favorite = ratingDelta(1200, 1000, "win");
    const underdog = ratingDelta(1000, 1200, "win");
    expect(favorite).toBeLessThan(underdog);
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  });

  it("picks the higher score as winner", () => {
    expect(winnerFromScores(40, 22)).toBe("a");
    expect(winnerFromScores(10, 18)).toBe("b");
    expect(winnerFromScores(12, 12)).toBe("draw");
  });
});

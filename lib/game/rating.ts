import { RATING_K } from "@/lib/game/types";

export type MatchOutcome = "win" | "loss" | "draw";
export type WinnerSide = "a" | "b" | "draw";

export function expectedScore(rating: number, opponentRating: number) {
  return 1 / (1 + 10 ** ((opponentRating - rating) / 400));
}

export function ratingDelta(
  rating: number,
  opponentRating: number,
  outcome: MatchOutcome,
) {
  const score = outcome === "win" ? 1 : outcome === "draw" ? 0.5 : 0;
  return Math.round(RATING_K * (score - expectedScore(rating, opponentRating)));
}

export function ratingPair(
  ratingA: number,
  ratingB: number,
  winner: WinnerSide,
) {
  const outcomeA: MatchOutcome =
    winner === "a" ? "win" : winner === "b" ? "loss" : "draw";
  const outcomeB: MatchOutcome =
    winner === "b" ? "win" : winner === "a" ? "loss" : "draw";
  return {
    deltaA: ratingDelta(ratingA, ratingB, outcomeA),
    deltaB: ratingDelta(ratingB, ratingA, outcomeB),
  };
}

export function winnerFromScores(scoreA: number, scoreB: number): WinnerSide {
  if (scoreA > scoreB) return "a";
  if (scoreB > scoreA) return "b";
  return "draw";
}

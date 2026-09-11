import type { MatchKind, MatchStatus, MatchWinner, Role } from "@/db/schema";
import { scoreLineup } from "@/lib/game/score";
import { snapshotToPlayCards } from "@/lib/game/snapshot";
import type { LineupSnapshotCard } from "@/lib/game/play-card";
import { DECK_SIZE, type LineupScore, type ScoreRow } from "@/lib/game/types";

export type MatchRecord = {
  id: string;
  kind: MatchKind;
  status: MatchStatus;
  revealedCount: number;
  playerAId: string;
  playerBId: string | null;
  playerAName: string;
  playerBName: string;
  playerARating: number;
  playerBRating: number;
  playerALineup: LineupSnapshotCard[];
  playerBLineup: LineupSnapshotCard[];
  winnerSide: MatchWinner | null;
  ratingDeltaA: number | null;
  ratingDeltaB: number | null;
};

export type MatchViewer = {
  id: string;
  role: Role;
};

export type VisibleSlot = {
  slot: number;
  revealed: boolean;
  card: LineupSnapshotCard | null;
  backImageUrl: string | null;
  row: ScoreRow | null;
};

export type MatchSideView = {
  name: string;
  rating: number;
  score: number;
  rows: ScoreRow[];
  slots: VisibleSlot[];
  isYou: boolean;
};

export type MatchView = {
  id: string;
  kind: MatchKind;
  status: MatchStatus;
  revealedCount: number;
  playerA: MatchSideView;
  playerB: MatchSideView;
  winnerSide: MatchWinner | null;
  ratingDeltaA: number | null;
  ratingDeltaB: number | null;
  youAre: "a" | "b" | "spectator";
};

export type MatchPayload = {
  view: MatchView;
  god: MatchView | null;
  canReveal: boolean;
  canDevControl: boolean;
};

export function canViewMatch(match: MatchRecord, viewer: MatchViewer) {
  return (
    viewer.role === "admin" ||
    match.playerAId === viewer.id ||
    match.playerBId === viewer.id
  );
}

export function canDevControlMatch(match: MatchRecord, viewer: MatchViewer) {
  if (viewer.role === "admin") return true;
  return match.kind === "practice" && match.playerAId === viewer.id;
}

export function canRevealMatch(match: MatchRecord, viewer: MatchViewer) {
  if (match.status !== "revealing") return false;
  if (match.revealedCount >= DECK_SIZE) return false;
  if (viewer.role === "admin") return true;
  return match.playerAId === viewer.id || match.playerBId === viewer.id;
}

function sideView(
  name: string,
  rating: number,
  lineup: LineupSnapshotCard[],
  revealedCount: number,
  isYou: boolean,
  showHidden: boolean,
): MatchSideView {
  const breakdown: LineupScore = scoreLineup(
    snapshotToPlayCards(lineup),
    revealedCount,
  );
  const rowById = new Map(breakdown.rows.map((row) => [row.cardId, row]));
  return {
    name,
    rating,
    score: breakdown.total,
    rows: breakdown.rows,
    isYou,
    slots: lineup.map((card, index) => {
      const revealed = index < revealedCount;
      const visible = revealed || showHidden;
      return {
        slot: index + 1,
        revealed,
        card: visible ? card : null,
        backImageUrl: card.backImageUrl,
        row: revealed ? (rowById.get(card.cardId) ?? null) : null,
      };
    }),
  };
}

export function viewMatch(
  match: MatchRecord,
  viewer: MatchViewer,
  godView = false,
): MatchView {
  const youAre =
    match.playerAId === viewer.id
      ? "a"
      : match.playerBId === viewer.id
        ? "b"
        : "spectator";
  return {
    id: match.id,
    kind: match.kind,
    status: match.status,
    revealedCount: match.revealedCount,
    winnerSide: match.winnerSide,
    ratingDeltaA: match.ratingDeltaA,
    ratingDeltaB: match.ratingDeltaB,
    youAre,
    playerA: sideView(
      match.playerAName,
      match.playerARating,
      match.playerALineup,
      match.revealedCount,
      youAre === "a",
      godView,
    ),
    playerB: sideView(
      match.playerBName,
      match.playerBRating,
      match.playerBLineup,
      match.revealedCount,
      youAre === "b",
      godView,
    ),
  };
}

export function buildMatchPayload(
  match: MatchRecord,
  viewer: MatchViewer,
): MatchPayload {
  const dev = canDevControlMatch(match, viewer);
  return {
    view: viewMatch(match, viewer, false),
    god: dev ? viewMatch(match, viewer, true) : null,
    canReveal: canRevealMatch(match, viewer),
    canDevControl: dev,
  };
}

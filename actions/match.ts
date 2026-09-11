"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { DeckError } from "@/db/queries/decks";
import {
  MatchError,
  revealAll,
  revealNext,
  rewindReveal,
  startPracticeMatch,
  startRankedMatch,
} from "@/db/queries/matches";
import { AuthError, requireAdmin, requireUser } from "@/lib/rbac";

async function translateMatchError(message: string) {
  const t = await getTranslations("match");
  switch (message) {
    case "Mark a six-relic lineup for queue first":
      return t("needQueueReady");
    case "No opponent with a queue-ready lineup":
      return t("noOpponent");
    case "Not enough relics in the catalog":
      return t("noCatalog");
    case "Duel not found":
      return t("notFound");
    case "You cannot reveal this duel":
      return t("cannotReveal");
    case "Dev controls are locked on this duel":
      return t("devLocked");
    case "Player not found":
      return t("playerNotFound");
    default:
      return message;
  }
}

async function fail(error: unknown) {
  if (
    error instanceof MatchError ||
    error instanceof DeckError ||
    error instanceof AuthError
  ) {
    return { error: await translateMatchError(error.message) };
  }
  throw error;
}

function revalidateMatch(matchId: string) {
  revalidatePath("/deck");
  revalidatePath("/admin/dev");
  revalidatePath(`/match/${matchId}`);
}

export async function startPracticeMatchAction() {
  try {
    const user = await requireUser();
    const match = await startPracticeMatch(user.id);
    revalidateMatch(match.id);
    return { matchId: match.id };
  } catch (error) {
    return fail(error);
  }
}

export async function startRankedMatchAction() {
  try {
    const user = await requireUser();
    const match = await startRankedMatch(user.id);
    revalidateMatch(match.id);
    return { matchId: match.id };
  } catch (error) {
    return fail(error);
  }
}

export async function startRankedVsUserAction(opponentId: string) {
  try {
    const user = await requireAdmin();
    const match = await startRankedMatch(user.id, opponentId);
    revalidateMatch(match.id);
    return { matchId: match.id };
  } catch (error) {
    return fail(error);
  }
}

export async function revealNextAction(matchId: string) {
  try {
    const user = await requireUser();
    const match = await revealNext(matchId, user);
    revalidateMatch(match.id);
    return { success: true, revealedCount: match.revealedCount };
  } catch (error) {
    return fail(error);
  }
}

export async function revealAllAction(matchId: string) {
  try {
    const user = await requireUser();
    const match = await revealAll(matchId, user);
    revalidateMatch(match.id);
    return { success: true, revealedCount: match.revealedCount };
  } catch (error) {
    return fail(error);
  }
}

export async function rewindRevealAction(matchId: string) {
  try {
    const user = await requireUser();
    const match = await rewindReveal(matchId, user);
    revalidateMatch(match.id);
    return { success: true, revealedCount: match.revealedCount };
  } catch (error) {
    return fail(error);
  }
}

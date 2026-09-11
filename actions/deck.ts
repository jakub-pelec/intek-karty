"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  DeckError,
  createDeck,
  deleteDeck,
  listDecks,
  renameDeck,
  saveDeckSlots,
  setActiveDeck,
} from "@/db/queries/decks";
import { AuthError, requireUser } from "@/lib/rbac";
import { DECK_SIZE, MAX_DECKS } from "@/lib/game/types";

const slotsSchema = z.array(z.union([z.string().uuid(), z.null()])).length(DECK_SIZE);

async function translateDeckError(message: string) {
  const t = await getTranslations("deck");
  switch (message) {
    case "Name is required":
      return t("nameRequired");
    case "You can keep at most 8 lineups":
      return t("tooMany", { max: MAX_DECKS });
    case "Lineup not found":
      return t("notFound");
    case "You do not own that relic":
      return t("notOwned");
    case "That relic is already in this lineup":
      return t("duplicateCard");
    case "Invalid lineup":
      return t("invalidSlots");
    case "A queue lineup needs six relics":
      return t("needSixActive");
    default:
      return message;
  }
}

async function fail(error: unknown) {
  if (error instanceof DeckError || error instanceof AuthError) {
    return { error: await translateDeckError(error.message) };
  }
  throw error;
}

export async function createDeckAction() {
  try {
    const user = await requireUser();
    const t = await getTranslations("deck");
    const existing = await listDecks(user.id);
    const id = await createDeck(
      user.id,
      t("defaultName", { n: existing.length + 1 }),
    );
    revalidatePath("/deck");
    return { success: t("created"), deckId: id };
  } catch (error) {
    return fail(error);
  }
}

export async function renameDeckAction(deckId: string, name: string) {
  try {
    const user = await requireUser();
    await renameDeck(user.id, deckId, name);
    revalidatePath("/deck");
    const t = await getTranslations("deck");
    return { success: t("renamed") };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteDeckAction(deckId: string) {
  try {
    const user = await requireUser();
    await deleteDeck(user.id, deckId);
    revalidatePath("/deck");
    const t = await getTranslations("deck");
    return { success: t("deleted") };
  } catch (error) {
    return fail(error);
  }
}

export async function saveDeckSlotsAction(
  deckId: string,
  slots: (string | null)[],
) {
  try {
    const user = await requireUser();
    const parsed = slotsSchema.safeParse(slots);
    if (!parsed.success) {
      const t = await getTranslations("deck");
      return { error: t("invalidSlots") };
    }
    await saveDeckSlots(user.id, deckId, parsed.data);
    revalidatePath("/deck");
    const t = await getTranslations("deck");
    return { success: t("saved") };
  } catch (error) {
    return fail(error);
  }
}

export async function setActiveDeckAction(deckId: string) {
  try {
    const user = await requireUser();
    await setActiveDeck(user.id, deckId);
    revalidatePath("/deck");
    const t = await getTranslations("deck");
    return { success: t("activated") };
  } catch (error) {
    return fail(error);
  }
}

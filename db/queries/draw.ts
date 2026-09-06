import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  boosterDropRates,
  boosterTypes,
  cards,
  draws,
  userBoosters,
  userCards,
  users,
} from "@/db/schema";
import {
  activeCardsOfRarity,
  creditPoints,
  evaluateAchievements,
  type AchievementUnlock,
} from "@/db/queries/achievements";
import {
  DrawEngineError,
  duplicatePointsFor,
  pickCard,
  rollDrop,
  rollMutation,
} from "@/lib/draw-engine";

export class DrawError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DrawError";
  }
}

export type DrawResult = {
  drawId: string;
  card: typeof cards.$inferSelect;
  isDuplicate: boolean;
  pointsAwarded: number;
  holographic: boolean;
  signature: boolean;
  achievements: AchievementUnlock[];
};

export async function openUserBooster(input: {
  userBoosterId: string;
  adminId: string;
}): Promise<DrawResult> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [locked] = await tx
      .update(userBoosters)
      .set({
        status: "opened",
        openedAt: new Date(),
        openedBy: input.adminId,
      })
      .where(
        and(
          eq(userBoosters.id, input.userBoosterId),
          eq(userBoosters.status, "pending"),
        ),
      )
      .returning();

    if (!locked) {
      throw new DrawError("Booster is not pending or was already opened");
    }

    let userId = locked.userId;
    if (!userId) {
      const existing = await tx
        .select()
        .from(users)
        .where(eq(users.twitchId, locked.twitchId))
        .limit(1);
      if (existing[0]) {
        userId = existing[0].id;
      } else {
        const [created] = await tx
          .insert(users)
          .values({
            twitchId: locked.twitchId,
            name: `twitch:${locked.twitchId}`,
          })
          .onConflictDoNothing()
          .returning();
        if (created) {
          userId = created.id;
        } else {
          const [again] = await tx
            .select()
            .from(users)
            .where(eq(users.twitchId, locked.twitchId))
            .limit(1);
          userId = again?.id ?? null;
        }
      }
      if (!userId) {
        throw new DrawError("Could not resolve viewer account for this booster");
      }
      await tx
        .update(userBoosters)
        .set({ userId })
        .where(eq(userBoosters.id, locked.id));
    }

    const [boosterType] = await tx
      .select()
      .from(boosterTypes)
      .where(eq(boosterTypes.id, locked.boosterTypeId))
      .limit(1);
    if (!boosterType || !boosterType.active) {
      throw new DrawError("Booster type is missing or inactive");
    }

    const rates = await tx
      .select({
        rarity: boosterDropRates.rarity,
        signed: boosterDropRates.signed,
        probabilityBp: boosterDropRates.probabilityBp,
      })
      .from(boosterDropRates)
      .where(eq(boosterDropRates.boosterTypeId, boosterType.id));

    let drop;
    try {
      drop = rollDrop(rates);
    } catch (error) {
      throw error instanceof DrawEngineError
        ? new DrawError(error.message)
        : error;
    }

    const pool = await activeCardsOfRarity(
      tx,
      drop.rarity,
      drop.signed,
      boosterType.collectionId,
    );
    let card;
    try {
      card = pickCard(pool);
    } catch (error) {
      throw error instanceof DrawEngineError
        ? new DrawError(error.message)
        : error;
    }

    const holographic = rollMutation(boosterType.holographicChanceBp);
    const signature = card.signed;

    const [ownedRow] = await tx
      .select()
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, card.id)))
      .limit(1);
    const isDuplicate = Boolean(ownedRow);
    const pointsAwarded = isDuplicate ? duplicatePointsFor(card.rarity) : 0;

    const [viewer] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [draw] = await tx
      .insert(draws)
      .values({
        userId,
        boosterTypeId: boosterType.id,
        userBoosterId: locked.id,
        cardId: card.id,
        isDuplicate,
        pointsAwarded,
        triggeredBy: input.adminId,
        viewerName: viewer?.name ?? "Viewer",
        cardName: card.name,
        cardNumber: card.number,
        cardRarity: card.rarity,
        cardImageUrl: card.imageUrl,
        holographic,
        signature,
      })
      .returning();

    if (!isDuplicate) {
      await tx.insert(userCards).values({
        userId,
        cardId: card.id,
        drawId: draw.id,
        holographic,
        signature,
      });
    } else if (ownedRow) {
      if (holographic && !ownedRow.holographic) {
        await tx
          .update(userCards)
          .set({
            holographic: true,
          })
          .where(eq(userCards.id, ownedRow.id));
      }
      if (pointsAwarded > 0) {
        await creditPoints(tx, {
          userId,
          amount: pointsAwarded,
          source: "duplicate",
          refId: draw.id,
          note: `Duplicate ${card.name}`,
        });
      }
    }

    const unlocked = await evaluateAchievements(tx, userId);

    return {
      drawId: draw.id,
      card,
      isDuplicate,
      pointsAwarded,
      holographic,
      signature,
      achievements: unlocked,
    };
  });
}

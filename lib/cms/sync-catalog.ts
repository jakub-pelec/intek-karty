import { and, eq, inArray, isNull, not, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  achievements,
  boosterDropRates,
  boosterTypes,
  cards,
  collections,
  rewards,
} from "@/db/schema";
import {
  CmsSyncError,
  isCmsModel,
  isUniqueViolation,
  mapAchievement,
  mapBooster,
  mapCard,
  mapCollection,
  mapReward,
  nextRetiredNumber,
  shouldDeactivate,
  uniqueByDocumentId,
  type CmsModel,
} from "@/lib/cms/map-catalog";
import { cmsEnv, fetchCatalogFromStrapi } from "@/lib/cms/strapi";

let syncChain = Promise.resolve();

export function syncCatalogFromStrapi() {
  const run = syncChain.then(syncCatalogUnlocked, syncCatalogUnlocked);
  syncChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function deactivateAbsent(
  table:
    | typeof collections
    | typeof cards
    | typeof boosterTypes
    | typeof achievements
    | typeof rewards,
  keepCmsIds: string[],
) {
  const db = getDb();
  const now = { active: false, updatedAt: new Date() };
  if (keepCmsIds.length === 0) {
    await db.update(table).set(now);
    return;
  }
  await db
    .update(table)
    .set(now)
    .where(or(isNull(table.cmsId), not(inArray(table.cmsId, keepCmsIds))));
}

async function retireConflictingSlug(slug: string) {
  const db = getDb();
  const [conflict] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);
  if (!conflict) return;
  await db
    .update(collections)
    .set({
      slug: `${slug}-legacy-${conflict.id.slice(0, 8)}`,
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(collections.id, conflict.id));
}

async function retireCardRow(id: string, collectionId: string, signed: boolean) {
  const db = getDb();
  const [row] = await db
    .select({ n: cards.number })
    .from(cards)
    .where(and(eq(cards.collectionId, collectionId), eq(cards.signed, signed)))
    .orderBy(cards.number)
    .limit(1);
  await db
    .update(cards)
    .set({
      active: false,
      number: nextRetiredNumber(row?.n ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(cards.id, id));
}

async function findCardSlot(
  collectionId: string,
  number: number,
  signed: boolean,
) {
  const [row] = await getDb()
    .select({ id: cards.id, cmsId: cards.cmsId })
    .from(cards)
    .where(
      and(
        eq(cards.collectionId, collectionId),
        eq(cards.number, number),
        eq(cards.signed, signed),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function upsertCard(values: {
  cmsId: string;
  collectionId: string;
  number: number;
  name: string;
  description: string;
  rarity: (typeof cards.$inferInsert)["rarity"];
  signed: boolean;
  active: boolean;
  imageUrl: string | null;
  holoMapUrl: string | null;
  updatedAt: Date;
}) {
  const db = getDb();
  const existing = await findIdByCmsId(cards, values.cmsId);
  if (existing) {
    await db.update(cards).set(values).where(eq(cards.id, existing));
    return;
  }

  const slot = await findCardSlot(values.collectionId, values.number, values.signed);
  if (slot && slot.cmsId && slot.cmsId !== values.cmsId) {
    await retireCardRow(slot.id, values.collectionId, values.signed);
  } else if (slot) {
    await db.update(cards).set(values).where(eq(cards.id, slot.id));
    return;
  }

  try {
    await db.insert(cards).values(values);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const again = await findIdByCmsId(cards, values.cmsId);
    if (again) {
      await db.update(cards).set(values).where(eq(cards.id, again));
      return;
    }
    const taken = await findCardSlot(values.collectionId, values.number, values.signed);
    if (taken && taken.cmsId && taken.cmsId !== values.cmsId) {
      await retireCardRow(taken.id, values.collectionId, values.signed);
      await db.insert(cards).values(values);
      return;
    }
    if (taken) {
      await db.update(cards).set(values).where(eq(cards.id, taken.id));
      return;
    }
    throw error;
  }
}

async function findIdByCmsId(
  table: typeof collections | typeof cards | typeof boosterTypes | typeof achievements | typeof rewards,
  cmsId: string,
) {
  const [row] = await getDb()
    .select({ id: table.id })
    .from(table)
    .where(eq(table.cmsId, cmsId))
    .limit(1);
  return row?.id ?? null;
}

export async function deactivateCmsEntry(model: string, cmsId: string) {
  if (!isCmsModel(model) || !cmsId) {
    throw new CmsSyncError("Webhook is missing a model or document id");
  }
  const db = getDb();
  const now = { active: false, updatedAt: new Date() };
  if (model === "collection") {
    await db.update(collections).set(now).where(eq(collections.cmsId, cmsId));
  } else if (model === "card") {
    await db.update(cards).set(now).where(eq(cards.cmsId, cmsId));
  } else if (model === "booster") {
    await db.update(boosterTypes).set(now).where(eq(boosterTypes.cmsId, cmsId));
  } else if (model === "achievement") {
    await db.update(achievements).set(now).where(eq(achievements.cmsId, cmsId));
  } else {
    await db.update(rewards).set(now).where(eq(rewards.cmsId, cmsId));
  }
}

async function syncCatalogUnlocked() {
  const { strapiUrl } = cmsEnv();
  const raw = await fetchCatalogFromStrapi();
  const db = getDb();
  const publishedCards = uniqueByDocumentId(raw.cards);

  const mappedCollections = raw.collections.map((entry) =>
    mapCollection(entry, strapiUrl),
  );
  const collectionIds = new Map<string, string>();

  for (const row of mappedCollections) {
    const existing = await findIdByCmsId(collections, row.cmsId);

    const values = {
      cmsId: row.cmsId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      backImageUrl: row.backImageUrl,
      active: row.active,
      sortOrder: row.sortOrder,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(collections).set(values).where(eq(collections.id, existing));
      collectionIds.set(row.cmsId, existing);
    } else {
      await retireConflictingSlug(row.slug);
      const [created] = await db.insert(collections).values(values).returning({ id: collections.id });
      collectionIds.set(row.cmsId, created.id);
    }
  }

  for (const entry of publishedCards) {
    const row = mapCard(entry, strapiUrl);
    const collectionId =
      collectionIds.get(row.collectionCmsId) ??
      (await findIdByCmsId(collections, row.collectionCmsId));
    if (!collectionId) {
      throw new CmsSyncError(`Card ${row.name} references an unknown collection`);
    }
    await upsertCard({
      cmsId: row.cmsId,
      collectionId,
      number: row.number,
      name: row.name,
      description: row.description,
      rarity: row.rarity,
      signed: row.signed,
      active: row.active,
      imageUrl: row.imageUrl,
      holoMapUrl: row.holoMapUrl,
      updatedAt: new Date(),
    });
  }

  for (const entry of raw.boosters) {
    const row = mapBooster(entry, strapiUrl);
    const collectionId =
      collectionIds.get(row.collectionCmsId) ??
      (await findIdByCmsId(collections, row.collectionCmsId));
    if (!collectionId) {
      throw new CmsSyncError(`Booster ${row.name} references an unknown collection`);
    }
    const existing = await findIdByCmsId(boosterTypes, row.cmsId);
    const values = {
      cmsId: row.cmsId,
      collectionId,
      slug: row.slug,
      name: row.name,
      twitchChannelPointCost: row.twitchChannelPointCost,
      twitchRewardId: row.twitchRewardId,
      holographicChanceBp: row.holographicChanceBp,
      frontImageUrl: row.frontImageUrl,
      backImageUrl: row.backImageUrl,
      active: row.active,
      updatedAt: new Date(),
    };
    let boosterId = existing;
    if (existing) {
      await db.update(boosterTypes).set(values).where(eq(boosterTypes.id, existing));
    } else {
      const [conflict] = await db
        .select({ id: boosterTypes.id })
        .from(boosterTypes)
        .where(eq(boosterTypes.slug, row.slug))
        .limit(1);
      if (conflict) {
        await db
          .update(boosterTypes)
          .set({
            slug: `${row.slug}-legacy-${conflict.id.slice(0, 8)}`,
            active: false,
            updatedAt: new Date(),
          })
          .where(eq(boosterTypes.id, conflict.id));
      }
      boosterId = (
        await db.insert(boosterTypes).values(values).returning({ id: boosterTypes.id })
      )[0].id;
    }
    await db.delete(boosterDropRates).where(eq(boosterDropRates.boosterTypeId, boosterId));
    if (row.rates.length) {
      await db.insert(boosterDropRates).values(
        row.rates.map((rate) => ({
          boosterTypeId: boosterId,
          rarity: rate.rarity,
          signed: rate.signed,
          probabilityBp: rate.probabilityBp,
        })),
      );
    }
  }

  for (const entry of raw.achievements) {
    const row = mapAchievement(entry);
    const existing =
      (await findIdByCmsId(achievements, row.cmsId)) ??
      (
        await getDb()
          .select({ id: achievements.id })
          .from(achievements)
          .where(eq(achievements.slug, row.slug))
          .limit(1)
      )[0]?.id ??
      null;
    const values = {
      cmsId: row.cmsId,
      slug: row.slug,
      name: row.name,
      description: row.description,
      conditionType: row.conditionType,
      threshold: row.threshold,
      collectionSlug: row.collectionSlug,
      pointReward: row.pointReward,
      active: row.active,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(achievements).set(values).where(eq(achievements.id, existing));
    } else {
      await db.insert(achievements).values(values);
    }
  }

  for (const entry of raw.rewards) {
    const row = mapReward(entry);
    const existing = await findIdByCmsId(rewards, row.cmsId);
    const values = {
      cmsId: row.cmsId,
      name: row.name,
      description: row.description,
      pointCost: row.pointCost,
      stock: row.stock,
      active: row.active,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(rewards).set(values).where(eq(rewards.id, existing));
    } else {
      await db.insert(rewards).values(values);
    }
  }

  const mappedCards = publishedCards.map((entry) => mapCard(entry, strapiUrl));
  const mappedBoosters = raw.boosters.map((entry) => mapBooster(entry, strapiUrl));
  const mappedAchievements = raw.achievements.map(mapAchievement);
  const mappedRewards = raw.rewards.map(mapReward);

  await deactivateAbsent(
    collections,
    mappedCollections.map((row) => row.cmsId),
  );
  await deactivateAbsent(
    cards,
    mappedCards.map((row) => row.cmsId),
  );
  await deactivateAbsent(
    boosterTypes,
    mappedBoosters.map((row) => row.cmsId),
  );
  await deactivateAbsent(
    achievements,
    mappedAchievements.map((row) => row.cmsId),
  );
  await deactivateAbsent(
    rewards,
    mappedRewards.map((row) => row.cmsId),
  );

  return {
    collections: mappedCollections.length,
    cards: publishedCards.length,
    boosters: raw.boosters.length,
    achievements: raw.achievements.length,
    rewards: raw.rewards.length,
  };
}

export async function handleCmsWebhook(input: {
  event: string;
  model: string;
  documentId?: string;
}) {
  if (shouldDeactivate(input.event) && input.documentId && isCmsModel(input.model)) {
    await deactivateCmsEntry(input.model as CmsModel, input.documentId);
  }
  const counts = await syncCatalogFromStrapi();
  return { action: "synced" as const, ...counts };
}

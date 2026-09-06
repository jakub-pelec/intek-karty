import "./load-env";
import { and, eq, inArray, sql } from "drizzle-orm";
import { closeDb, getDb } from "./index";
import { evaluateAchievements } from "./queries/achievements";
import {
  achievements,
  boosterDropRates,
  boosterTypes,
  cards,
  collections,
  draws,
  rewards,
  shopRedemptions,
  userAchievements,
  userBoosters,
  userCards,
  users,
} from "./schema";
import { SEED_ACHIEVEMENTS } from "./seed-data/achievements";
import { SEED_BOOSTERS } from "./seed-data/boosters";
import { SEED_CARDS } from "./seed-data/cards";
import { ORIGIN_COLLECTION, ORIGIN_COLLECTION_ID } from "./seed-data/collections";
import {
  DEMO_NOTE,
  DEMO_OWNED_CARD_NUMBERS,
  DEMO_QUEUE_TWITCH_IDS,
  DEMO_TWITCH_ID,
  DEMO_USER_NAME,
} from "./seed-data/demo";
import { SEED_REWARDS } from "./seed-data/rewards";
import { liveCms } from "@/lib/cms/live";
import { syncCatalogFromStrapi } from "@/lib/cms/sync-catalog";

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in .env or .env.local");
  }
  if (url.includes("@host:") || url.includes("postgres.xxxx")) {
    throw new Error(
      "DATABASE_URL is still the example placeholder. Paste your real Supabase connection string.",
    );
  }
}

async function seedOriginCollection() {
  const db = getDb();
  const [existing] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, ORIGIN_COLLECTION.slug))
    .limit(1);
  if (existing) {
    await db
      .update(collections)
      .set({
        name: ORIGIN_COLLECTION.name,
        description: ORIGIN_COLLECTION.description,
        backImageUrl: ORIGIN_COLLECTION.backImageUrl,
        active: ORIGIN_COLLECTION.active,
        sortOrder: ORIGIN_COLLECTION.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, existing.id));
    return existing.id;
  }
  await db.insert(collections).values(ORIGIN_COLLECTION);
  return ORIGIN_COLLECTION_ID;
}

async function seedCards(collectionId: string) {
  const db = getDb();
  for (const card of SEED_CARDS) {
    const existing = await db
      .select({ id: cards.id })
      .from(cards)
      .where(
        and(
          eq(cards.collectionId, collectionId),
          eq(cards.number, card.number),
          eq(cards.signed, card.signed ?? false),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db
        .update(cards)
        .set({
          collectionId,
          name: card.name,
          description: card.description,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          signed: card.signed ?? false,
          updatedAt: new Date(),
        })
        .where(eq(cards.id, existing[0].id));
    } else {
      await db.insert(cards).values({
        ...card,
        collectionId,
        signed: card.signed ?? false,
      });
    }
  }
}

async function seedBoosters(collectionId: string) {
  const db = getDb();
  for (const booster of SEED_BOOSTERS) {
    const existing = await db
      .select({ id: boosterTypes.id })
      .from(boosterTypes)
      .where(eq(boosterTypes.slug, booster.slug))
      .limit(1);

    let boosterId = existing[0]?.id;
    if (boosterId) {
      await db
        .update(boosterTypes)
        .set({
          collectionId,
          name: booster.name,
          twitchChannelPointCost: booster.twitchChannelPointCost,
          holographicChanceBp: booster.holographicChanceBp,
          frontImageUrl: booster.frontImageUrl,
          backImageUrl: booster.backImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(boosterTypes.id, boosterId));
      await db
        .delete(boosterDropRates)
        .where(eq(boosterDropRates.boosterTypeId, boosterId));
    } else {
      const [created] = await db
        .insert(boosterTypes)
        .values({
          collectionId,
          slug: booster.slug,
          name: booster.name,
          twitchChannelPointCost: booster.twitchChannelPointCost,
          holographicChanceBp: booster.holographicChanceBp,
          frontImageUrl: booster.frontImageUrl,
          backImageUrl: booster.backImageUrl,
        })
        .returning({ id: boosterTypes.id });
      boosterId = created.id;
    }

    await db.insert(boosterDropRates).values(
      booster.rates.map((rate) => ({
        boosterTypeId: boosterId!,
        rarity: rate.rarity,
        signed: rate.signed,
        probabilityBp: rate.probabilityBp,
      })),
    );
  }
}

async function seedAchievements() {
  const db = getDb();
  for (const achievement of SEED_ACHIEVEMENTS) {
    const existing = await db
      .select({ id: achievements.id })
      .from(achievements)
      .where(eq(achievements.slug, achievement.slug))
      .limit(1);

    if (existing[0]) {
      await db
        .update(achievements)
        .set({
          name: achievement.name,
          description: achievement.description,
          conditionType: achievement.conditionType,
          threshold: achievement.threshold,
          pointReward: achievement.pointReward,
          updatedAt: new Date(),
        })
        .where(eq(achievements.id, existing[0].id));
    } else {
      await db.insert(achievements).values(achievement);
    }
  }
}

async function seedShopRewards() {
  const db = getDb();
  for (const reward of SEED_REWARDS) {
    const existing = await db
      .select({ id: rewards.id })
      .from(rewards)
      .where(eq(rewards.name, reward.name))
      .limit(1);
    if (existing[0]) {
      await db
        .update(rewards)
        .set({
          description: reward.description,
          pointCost: reward.pointCost,
          stock: reward.stock,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(rewards.id, existing[0].id));
    } else {
      await db.insert(rewards).values(reward);
    }
  }
}

async function upsertDemoUser() {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.twitchId, DEMO_TWITCH_ID))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        name: existing.name || DEMO_USER_NAME,
        role: "admin",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(users)
    .values({
      twitchId: DEMO_TWITCH_ID,
      name: DEMO_USER_NAME,
      role: "admin",
    })
    .returning();
  return created;
}

async function seedDemoCollection(
  userId: string,
  viewerName: string,
  collectionId: string,
) {
  const db = getDb();
  const catalog = await db
    .select()
    .from(cards)
    .where(
      and(
        eq(cards.collectionId, collectionId),
        inArray(cards.number, DEMO_OWNED_CARD_NUMBERS),
        liveCms(cards),
      ),
    );
  const [booster] = await db
    .select()
    .from(boosterTypes)
    .where(and(eq(boosterTypes.slug, "booster"), liveCms(boosterTypes)))
    .limit(1);

  for (const card of catalog) {
    const [owned] = await db
      .select({ id: userCards.id })
      .from(userCards)
      .where(and(eq(userCards.userId, userId), eq(userCards.cardId, card.id)))
      .limit(1);
    if (owned) continue;

    const [draw] = await db
      .insert(draws)
      .values({
        userId,
        boosterTypeId: booster?.id ?? null,
        cardId: card.id,
        isDuplicate: false,
        pointsAwarded: 0,
        triggeredBy: userId,
        note: DEMO_NOTE,
        viewerName,
        cardName: card.name,
        cardNumber: card.number,
        cardRarity: card.rarity,
        cardImageUrl: card.imageUrl,
      })
      .returning({ id: draws.id });

    await db.insert(userCards).values({
      userId,
      cardId: card.id,
      drawId: draw.id,
    });
  }
}

async function seedDemoAchievements(userId: string) {
  await getDb().transaction((tx) => evaluateAchievements(tx, userId));
}

async function seedBoosterQueue(userId: string) {
  const db = getDb();
  const types = await db.select().from(boosterTypes).where(liveCms(boosterTypes));
  const bySlug = new Map(types.map((row) => [row.slug, row]));

  await db
    .delete(userBoosters)
    .where(and(eq(userBoosters.note, DEMO_NOTE), eq(userBoosters.status, "pending")));

  const queue: { twitchId: string; slug: string; linkedUser: boolean }[] = [
    { twitchId: DEMO_TWITCH_ID, slug: "booster", linkedUser: true },
    { twitchId: DEMO_TWITCH_ID, slug: "booster-pro", linkedUser: true },
    { twitchId: DEMO_QUEUE_TWITCH_IDS[1], slug: "booster", linkedUser: false },
    { twitchId: DEMO_QUEUE_TWITCH_IDS[2], slug: "joker-hunt", linkedUser: false },
  ];

  for (const item of queue) {
    const type = bySlug.get(item.slug);
    if (!type) continue;
    await db.insert(userBoosters).values({
      twitchId: item.twitchId,
      userId: item.linkedUser ? userId : null,
      boosterTypeId: type.id,
      status: "pending",
      note: DEMO_NOTE,
    });
  }
}

async function seedRewardsQueue(userId: string) {
  const db = getDb();
  const catalog = await db.select().from(rewards).where(liveCms(rewards));
  const shoutout = catalog.find((row) => row.name === "Shout-out on stream");
  const emote = catalog.find((row) => row.name === "Custom emote idea");
  if (!shoutout || !emote) return;

  const existing = await db
    .select({ id: shopRedemptions.id })
    .from(shopRedemptions)
    .where(eq(shopRedemptions.userId, userId));
  if (existing.length > 0) return;

  await db.insert(shopRedemptions).values([
    {
      userId,
      rewardId: shoutout.id,
      pointsSpent: shoutout.pointCost,
      status: "pending_fulfillment",
    },
    {
      userId,
      rewardId: emote.id,
      pointsSpent: emote.pointCost,
      status: "pending_fulfillment",
    },
  ]);
}

async function printSummary(userId: string) {
  const db = getDb();
  const [cardCount] = await db.select({ n: sql<number>`count(*)::int` }).from(cards);
  const [ownedCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userCards)
    .where(eq(userCards.userId, userId));
  const [unlockCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const [queueCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(userBoosters)
    .where(eq(userBoosters.status, "pending"));
  const [redeemCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(shopRedemptions)
    .where(eq(shopRedemptions.status, "pending_fulfillment"));
  const [user] = await db
    .select({ pointsBalance: users.pointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  console.log("Seed complete:");
  console.log(`  catalog cards:     ${cardCount.n}`);
  console.log(`  owned by you:      ${ownedCount.n}`);
  console.log(`  achievements:      ${unlockCount.n} unlocked`);
  console.log(`  booster queue:     ${queueCount.n} pending`);
  console.log(`  rewards queue:     ${redeemCount.n} pending`);
  console.log(`  collector points:  ${user?.pointsBalance ?? 0}`);
}

async function printBoosterSummary() {
  const db = getDb();
  const rows = await db
    .select({
      slug: boosterTypes.slug,
      name: boosterTypes.name,
      frontImageUrl: boosterTypes.frontImageUrl,
      backImageUrl: boosterTypes.backImageUrl,
    })
    .from(boosterTypes);
  console.log(`Seeded ${rows.length} booster type(s):`);
  for (const row of rows) {
    console.log(`  ${row.slug}  ${row.frontImageUrl ?? "—"}  ${row.backImageUrl ?? "—"}`);
  }
}

async function seedCatalogFromCms() {
  if (!process.env.STRAPI_URL || !process.env.STRAPI_TOKEN) {
    throw new Error(
      "STRAPI_URL and STRAPI_TOKEN are required. Catalog is edited only in Strapi. Run pnpm cms:pull after publishing.",
    );
  }
  console.log("Pulling catalog from Strapi…");
  await syncCatalogFromStrapi();
  const [first] = await getDb()
    .select({ id: collections.id })
    .from(collections)
    .where(liveCms(collections))
    .orderBy(collections.sortOrder)
    .limit(1);
  if (!first) throw new Error("Strapi pull left no active collections");
  return first.id;
}

async function seed() {
  requireDatabaseUrl();
  const only = process.argv[2];

  if (only === "boosters") {
    console.log("Seeding booster types and pending queue…");
    await seedCatalogFromCms();
    const user = await upsertDemoUser();
    await seedBoosterQueue(user.id);
    await printBoosterSummary();
    const [queueCount] = await getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(userBoosters)
      .where(eq(userBoosters.status, "pending"));
    console.log(`  pending in queue:  ${queueCount.n}`);
    await closeDb();
    return;
  }

  if (only) {
    throw new Error(`Unknown seed target "${only}". Use: npm run db:seed or npm run db:seed:boosters`);
  }

  console.log("Seeding catalog, shop, demo user, queues…");
  const collectionId = await seedCatalogFromCms();

  const user = await upsertDemoUser();
  await seedDemoCollection(user.id, user.name, collectionId);
  await seedDemoAchievements(user.id);
  await seedBoosterQueue(user.id);
  await seedRewardsQueue(user.id);
  await printSummary(user.id);
  await closeDb();
}

seed().catch(async (error) => {
  const cause =
    error && typeof error === "object" && "cause" in error
      ? (error as { cause?: { code?: string } }).cause
      : undefined;
  if (cause?.code === "ECONNREFUSED") {
    console.error(
      "Could not reach Postgres. In Supabase use Connect → Session pooler (port 6543), user postgres.<project-ref>, and add ?sslmode=require. The direct db.*.supabase.co:5432 host is often blocked.",
    );
  }
  console.error(error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});

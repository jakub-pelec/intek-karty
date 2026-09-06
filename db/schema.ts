import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const rarityEnum = pgEnum("rarity", [
  "common",
  "rare",
  "epic",
  "legendary",
  "joker",
]);

export const roleEnum = pgEnum("role", ["viewer", "admin"]);

export const boosterStatusEnum = pgEnum("booster_status", [
  "pending",
  "opened",
  "cancelled",
]);

export const ledgerSourceEnum = pgEnum("ledger_source", [
  "duplicate",
  "achievement",
  "shop_redeem",
  "admin_adjust",
]);

export const achievementConditionEnum = pgEnum("achievement_condition", [
  "first_booster",
  "first_epic",
  "first_legendary",
  "first_joker",
  "cards_collected_threshold",
  "full_collection",
]);

export const redemptionStatusEnum = pgEnum("redemption_status", [
  "pending_fulfillment",
  "fulfilled",
  "cancelled",
]);

export type Rarity = (typeof rarityEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];
export type BoosterStatus = (typeof boosterStatusEnum.enumValues)[number];
export type LedgerSource = (typeof ledgerSourceEnum.enumValues)[number];
export type AchievementCondition =
  (typeof achievementConditionEnum.enumValues)[number];
export type RedemptionStatus = (typeof redemptionStatusEnum.enumValues)[number];

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    twitchId: text("twitch_id").notNull(),
    name: text("name").notNull(),
    image: text("image"),
    role: roleEnum("role").default("viewer").notNull(),
    pointsBalance: integer("points_balance").default(0).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_twitch_id_idx").on(table.twitchId)],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    backImageUrl: text("back_image_url"),
    cmsId: text("cms_id"),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collections_slug_idx").on(table.slug),
    uniqueIndex("collections_cms_id_idx").on(table.cmsId),
  ],
);

export const cards = pgTable(
  "cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id),
    number: integer("number").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    rarity: rarityEnum("rarity").notNull(),
    imageUrl: text("image_url"),
    cmsId: text("cms_id"),
    signed: boolean("signed").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cards_collection_number_signed_idx").on(
      table.collectionId,
      table.number,
      table.signed,
    ),
    uniqueIndex("cards_cms_id_idx").on(table.cmsId),
  ],
);

export const boosterTypes = pgTable(
  "booster_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    twitchChannelPointCost: integer("twitch_channel_point_cost").notNull(),
    twitchRewardId: text("twitch_reward_id"),
    holographicChanceBp: integer("holographic_chance_bp").default(0).notNull(),
    frontImageUrl: text("front_image_url"),
    backImageUrl: text("back_image_url"),
    cmsId: text("cms_id"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("booster_types_slug_idx").on(table.slug),
    uniqueIndex("booster_types_twitch_reward_id_idx").on(table.twitchRewardId),
    uniqueIndex("booster_types_cms_id_idx").on(table.cmsId),
  ],
);

export const boosterDropRates = pgTable(
  "booster_drop_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    boosterTypeId: uuid("booster_type_id")
      .notNull()
      .references(() => boosterTypes.id, { onDelete: "cascade" }),
    rarity: rarityEnum("rarity").notNull(),
    signed: boolean("signed").default(false).notNull(),
    probabilityBp: integer("probability_bp").notNull(),
  },
  (table) => [
    uniqueIndex("booster_drop_rates_type_rarity_signed_idx").on(
      table.boosterTypeId,
      table.rarity,
      table.signed,
    ),
  ],
);

export const userBoosters = pgTable(
  "user_boosters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    twitchId: text("twitch_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    boosterTypeId: uuid("booster_type_id")
      .notNull()
      .references(() => boosterTypes.id),
    status: boosterStatusEnum("status").default("pending").notNull(),
    twitchRedemptionId: text("twitch_redemption_id"),
    openedBy: uuid("opened_by").references(() => users.id),
    note: text("note"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_boosters_redemption_idx").on(table.twitchRedemptionId),
    index("user_boosters_status_idx").on(table.status, table.createdAt),
    index("user_boosters_twitch_id_idx").on(table.twitchId),
  ],
);

export const draws = pgTable(
  "draws",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    boosterTypeId: uuid("booster_type_id").references(() => boosterTypes.id),
    userBoosterId: uuid("user_booster_id").references(() => userBoosters.id),
    note: text("note"),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    isDuplicate: boolean("is_duplicate").default(false).notNull(),
    pointsAwarded: integer("points_awarded").default(0).notNull(),
    triggeredBy: uuid("triggered_by")
      .notNull()
      .references(() => users.id),
    viewerName: text("viewer_name").notNull().default(""),
    cardName: text("card_name").notNull().default(""),
    cardNumber: integer("card_number").notNull().default(0),
    cardRarity: rarityEnum("card_rarity").notNull().default("common"),
    cardImageUrl: text("card_image_url"),
    holographic: boolean("holographic").default(false).notNull(),
    signature: boolean("signature").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("draws_user_booster_idx").on(table.userBoosterId),
    index("draws_created_at_idx").on(table.createdAt),
    index("draws_user_id_idx").on(table.userId),
  ],
);

export const userCards = pgTable(
  "user_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => cards.id),
    drawId: uuid("draw_id").references(() => draws.id),
    holographic: boolean("holographic").default(false).notNull(),
    signature: boolean("signature").default(false).notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("user_cards_user_card_idx").on(table.userId, table.cardId)],
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    source: ledgerSourceEnum("source").notNull(),
    refId: uuid("ref_id"),
    note: text("note"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("points_ledger_user_idx").on(table.userId, table.createdAt)],
);

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    conditionType: achievementConditionEnum("condition_type").notNull(),
    threshold: integer("threshold"),
    pointReward: integer("point_reward").default(0).notNull(),
    cmsId: text("cms_id"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("achievements_slug_idx").on(table.slug),
    uniqueIndex("achievements_cms_id_idx").on(table.cmsId),
  ],
);

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_achievements_user_ach_idx").on(
      table.userId,
      table.achievementId,
    ),
  ],
);

export const rewards = pgTable(
  "rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    pointCost: integer("point_cost").notNull(),
    stock: integer("stock"),
    cmsId: text("cms_id"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("rewards_cms_id_idx").on(table.cmsId)],
);

export const shopRedemptions = pgTable(
  "shop_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id),
    pointsSpent: integer("points_spent").notNull(),
    status: redemptionStatusEnum("status")
      .default("pending_fulfillment")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("shop_redemptions_created_at_idx").on(table.createdAt)],
);

export const usersRelations = relations(users, ({ many }) => ({
  cards: many(userCards),
  boosters: many(userBoosters),
  draws: many(draws),
  ledger: many(pointsLedger),
  achievements: many(userAchievements),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  cards: many(cards),
  boosterTypes: many(boosterTypes),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  collection: one(collections, {
    fields: [cards.collectionId],
    references: [collections.id],
  }),
  owners: many(userCards),
}));

export const boosterTypesRelations = relations(boosterTypes, ({ one, many }) => ({
  collection: one(collections, {
    fields: [boosterTypes.collectionId],
    references: [collections.id],
  }),
  dropRates: many(boosterDropRates),
  userBoosters: many(userBoosters),
}));

export const boosterDropRatesRelations = relations(
  boosterDropRates,
  ({ one }) => ({
    boosterType: one(boosterTypes, {
      fields: [boosterDropRates.boosterTypeId],
      references: [boosterTypes.id],
    }),
  }),
);

export const userBoostersRelations = relations(userBoosters, ({ one }) => ({
  user: one(users, { fields: [userBoosters.userId], references: [users.id] }),
  boosterType: one(boosterTypes, {
    fields: [userBoosters.boosterTypeId],
    references: [boosterTypes.id],
  }),
}));

export const drawsRelations = relations(draws, ({ one }) => ({
  user: one(users, { fields: [draws.userId], references: [users.id] }),
  card: one(cards, { fields: [draws.cardId], references: [cards.id] }),
  boosterType: one(boosterTypes, {
    fields: [draws.boosterTypeId],
    references: [boosterTypes.id],
  }),
  triggeredByUser: one(users, {
    fields: [draws.triggeredBy],
    references: [users.id],
  }),
}));

export const userCardsRelations = relations(userCards, ({ one }) => ({
  user: one(users, { fields: [userCards.userId], references: [users.id] }),
  card: one(cards, { fields: [userCards.cardId], references: [cards.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  unlocks: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);

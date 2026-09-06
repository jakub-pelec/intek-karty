import type { AchievementCondition, Rarity } from "@/db/schema";

export const TOTAL_CARDS = 37;

export const RARITIES = [
  "common",
  "rare",
  "epic",
  "legendary",
  "joker",
] as const satisfies readonly Rarity[];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  joker: "Joker",
};

export const DUPLICATE_POINTS: Record<Rarity, number> = {
  common: 2,
  rare: 4,
  epic: 10,
  legendary: 20,
  joker: 50,
};

export const SEED_RARITY_COUNTS: Record<Rarity, number> = {
  common: 18,
  rare: 10,
  epic: 5,
  legendary: 3,
  joker: 1,
};

export const ACHIEVEMENT_CONDITION_LABELS: Record<AchievementCondition, string> = {
  first_booster: "First booster opened",
  first_epic: "First Epic card",
  first_legendary: "First Legendary card",
  first_joker: "First Joker obtained",
  cards_collected_threshold: "Cards collected threshold",
  full_collection: "Full collection",
};

export const LEDGER_SOURCE_LABELS = {
  duplicate: "Duplicate card",
  achievement: "Achievement",
  shop_redeem: "Shop redemption",
  admin_adjust: "Admin adjustment",
} as const;

export const PAGE_SIZE = 20;

import type { AchievementCondition } from "@/db/schema";

export type SeedAchievement = {
  slug: string;
  name: string;
  description: string;
  conditionType: AchievementCondition;
  threshold: number | null;
  pointReward: number;
};

export const SEED_ACHIEVEMENTS: SeedAchievement[] = [
  {
    slug: "first-booster",
    name: "First Pack",
    description: "Open your first booster on stream.",
    conditionType: "first_booster",
    threshold: null,
    pointReward: 5,
  },
  {
    slug: "first-epic",
    name: "Epic Taste",
    description: "Collect your first Epic card.",
    conditionType: "first_epic",
    threshold: null,
    pointReward: 10,
  },
  {
    slug: "first-legendary",
    name: "Legendary Luck",
    description: "Collect your first Legendary card.",
    conditionType: "first_legendary",
    threshold: null,
    pointReward: 20,
  },
  {
    slug: "first-joker",
    name: "Wild Card",
    description: "Obtain the Joker.",
    conditionType: "first_joker",
    threshold: null,
    pointReward: 50,
  },
  {
    slug: "ten-cards",
    name: "Growing Binder",
    description: "Collect 10 unique cards.",
    conditionType: "cards_collected_threshold",
    threshold: 10,
    pointReward: 15,
  },
  {
    slug: "full-collection",
    name: "Completionist",
    description: "Collect every card in the set.",
    conditionType: "full_collection",
    threshold: null,
    pointReward: 100,
  },
];

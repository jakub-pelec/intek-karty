import type { Rarity } from "@/db/schema";

function packArt(slug: string, face: "front" | "back") {
  return `/boosters/${slug}-${face}.png`;
}

export type SeedBooster = {
  slug: string;
  name: string;
  twitchChannelPointCost: number;
  holographicChanceBp: number;
  frontImageUrl: string;
  backImageUrl: string;
  rates: { rarity: Rarity; signed: boolean; probabilityBp: number }[];
};

export const SEED_BOOSTERS: SeedBooster[] = [
  {
    slug: "booster",
    name: "Booster",
    twitchChannelPointCost: 4000,
    holographicChanceBp: 300,
    frontImageUrl: packArt("booster", "front"),
    backImageUrl: packArt("booster", "back"),
    rates: [
      { rarity: "common", signed: false, probabilityBp: 6400 },
      { rarity: "common", signed: true, probabilityBp: 100 },
      { rarity: "rare", signed: false, probabilityBp: 2500 },
      { rarity: "epic", signed: false, probabilityBp: 800 },
      { rarity: "legendary", signed: false, probabilityBp: 200 },
    ],
  },
  {
    slug: "booster-pro",
    name: "Booster Pro",
    twitchChannelPointCost: 8000,
    holographicChanceBp: 800,
    frontImageUrl: packArt("booster-pro", "front"),
    backImageUrl: packArt("booster-pro", "back"),
    rates: [
      { rarity: "common", signed: false, probabilityBp: 3400 },
      { rarity: "common", signed: true, probabilityBp: 100 },
      { rarity: "rare", signed: false, probabilityBp: 3500 },
      { rarity: "epic", signed: false, probabilityBp: 2000 },
      { rarity: "legendary", signed: false, probabilityBp: 800 },
      { rarity: "joker", signed: false, probabilityBp: 200 },
    ],
  },
  {
    slug: "joker-hunt",
    name: "Joker Hunt Booster",
    twitchChannelPointCost: 16767,
    holographicChanceBp: 1200,
    frontImageUrl: packArt("joker-hunt", "front"),
    backImageUrl: packArt("joker-hunt", "back"),
    rates: [
      { rarity: "rare", signed: false, probabilityBp: 4500 },
      { rarity: "epic", signed: false, probabilityBp: 3500 },
      { rarity: "legendary", signed: false, probabilityBp: 1500 },
      { rarity: "joker", signed: false, probabilityBp: 500 },
    ],
  },
];

import type { AchievementCondition } from "@/db/schema";

export type ProdAchievement = {
  slug: string;
  name: string;
  description: string;
  conditionType: AchievementCondition;
  threshold: number | null;
  pointReward: number;
  collectionSlug?: string;
};

export const ENGLISH_SEED_SLUGS = [
  "first-booster",
  "first-epic",
  "first-legendary",
  "first-joker",
  "ten-cards",
  "full-collection",
] as const;

export const NYAPPOLEON_SLUG = "nyappoleon";
export const NYAPPOLEON_NAME = /nyappoleon/i;

export function resolveNyappoleonSlug(
  collections: { slug: string; name?: string | null }[],
) {
  return (
    collections.find(
      (row) => NYAPPOLEON_NAME.test(row.slug) || NYAPPOLEON_NAME.test(row.name ?? ""),
    )?.slug ?? NYAPPOLEON_SLUG
  );
}

export function prodAchievements(nyappoleonSlug = NYAPPOLEON_SLUG): ProdAchievement[] {
  return [
    {
      slug: "pierwszy-krok",
      name: "Pierwszy krok",
      description: "Zdobądź jedną kartę.",
      conditionType: "cards_collected_threshold",
      threshold: 1,
      pointReward: 5,
    },
    {
      slug: "poczatkujacy-kolekcjoner",
      name: "Początkujący kolekcjoner",
      description: "Zdobądź 5 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 5,
      pointReward: 25,
    },
    {
      slug: "kolekcjoner",
      name: "Kolekcjoner",
      description: "Zdobądź 10 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 10,
      pointReward: 50,
    },
    {
      slug: "zaawansowany-kolekcjoner",
      name: "Zaawansowany kolekcjoner",
      description: "Zdobądź 20 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 20,
      pointReward: 150,
    },
    {
      slug: "ekspert-kolekcjonerski",
      name: "Ekspert kolekcjonerski",
      description: "Zdobądź 30 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 30,
      pointReward: 300,
    },
    {
      slug: "prawie-komplet",
      name: "Prawie komplet",
      description: "Zdobądź 35 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 35,
      pointReward: 500,
    },
    {
      slug: "pelna-kolekcja",
      name: "Pełna kolekcja",
      description: "Zdobądź 40 kart.",
      conditionType: "cards_collected_threshold",
      threshold: 40,
      pointReward: 750,
    },
    {
      slug: "blyskotka",
      name: "Błyskotka",
      description: "Zdobądź pierwszą kartę holo.",
      conditionType: "holo_collected_threshold",
      threshold: 1,
      pointReward: 10,
    },
    {
      slug: "holo-hunter",
      name: "Holo Hunter",
      description: "Zdobądź 10 kart holo.",
      conditionType: "holo_collected_threshold",
      threshold: 10,
      pointReward: 100,
    },
    {
      slug: "holo-maniac",
      name: "Holo Maniac",
      description: "Zdobądź 20 kart holo.",
      conditionType: "holo_collected_threshold",
      threshold: 20,
      pointReward: 250,
    },
    {
      slug: "holo-master",
      name: "Holo Master",
      description: "Zdobądź 30 kart holo.",
      conditionType: "holo_collected_threshold",
      threshold: 30,
      pointReward: 500,
    },
    {
      slug: "cala-kolekcja-blyszczy",
      name: "Cała kolekcja błyszczy",
      description: "Zdobądź 40 kart holo.",
      conditionType: "holo_collected_threshold",
      threshold: 40,
      pointReward: 1000,
    },
    {
      slug: "autograf",
      name: "Autograf",
      description: "Zdobądź pierwszą podpisaną kartę.",
      conditionType: "signed_collected_threshold",
      threshold: 1,
      pointReward: 100,
    },
    {
      slug: "lowca-podpisow",
      name: "Łowca podpisów",
      description: "Zdobądź 3 podpisane karty.",
      conditionType: "signed_collected_threshold",
      threshold: 3,
      pointReward: 250,
    },
    {
      slug: "kolekcjoner-podpisow",
      name: "Kolekcjoner podpisów",
      description: "Zdobądź 5 podpisanych kart.",
      conditionType: "signed_collected_threshold",
      threshold: 5,
      pointReward: 400,
    },
    {
      slug: "podpisana-kolekcja",
      name: "Podpisana kolekcja",
      description: "Zdobądź 10 podpisanych kart.",
      conditionType: "signed_collected_threshold",
      threshold: 10,
      pointReward: 700,
    },
    {
      slug: "perfekcyjna-karta",
      name: "Perfekcyjna karta",
      description: "Zdobądź podpisaną holo kartę legendarną.",
      conditionType: "signed_holo_legendary_threshold",
      threshold: 1,
      pointReward: 350,
    },
    {
      slug: "podwojny-blask",
      name: "Podwójny blask",
      description: "Zdobądź 5 podpisanych holo kart.",
      conditionType: "signed_holo_collected_threshold",
      threshold: 5,
      pointReward: 700,
    },
    {
      slug: "lowca-graala",
      name: "Łowca Graala",
      description: "Zdobądź pierwszą podpisaną kartę holo.",
      conditionType: "signed_holo_collected_threshold",
      threshold: 1,
      pointReward: 200,
    },
    {
      slug: "kolekcjoner-graali",
      name: "Kolekcjoner Graali",
      description: "Zdobądź 5 podpisanych holo kart legendarnych.",
      conditionType: "signed_holo_legendary_threshold",
      threshold: 5,
      pointReward: 1000,
    },
    {
      slug: "joker",
      name: "Joker",
      description: "Zdobądź kartę Joker.",
      conditionType: "first_joker",
      threshold: null,
      pointReward: 400,
    },
    {
      slug: "mini-kolekcjoner",
      name: "Mini kolekcjoner",
      description: "Zdobądź wszystkie karty z mini kolekcji Nyappoleon.",
      conditionType: "collection_complete",
      threshold: null,
      pointReward: 50,
      collectionSlug: nyappoleonSlug,
    },
    {
      slug: "mini-holo-master",
      name: "Mini holo Master",
      description: "Zdobądź wszystkie holo karty z mini kolekcji Nyappoleon.",
      conditionType: "collection_holo_complete",
      threshold: null,
      pointReward: 100,
      collectionSlug: nyappoleonSlug,
    },
    {
      slug: "mini-krok",
      name: "Mini krok",
      description: "Zdobądź kartę z mini kolekcji Nyappoleon.",
      conditionType: "collection_first_card",
      threshold: 1,
      pointReward: 10,
      collectionSlug: nyappoleonSlug,
    },
  ];
}

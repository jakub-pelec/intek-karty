import type { AchievementCondition } from "@/db/schema";
import {
  prodAchievements,
  resolveNyappoleonSlug,
} from "@/db/seed-data/prod-achievements";

const BY_SLUG = new Map(prodAchievements().map((row) => [row.slug, row]));

export function achievementSpec(
  row: {
    slug: string;
    conditionType: AchievementCondition;
    threshold: number | null;
    collectionSlug?: string | null;
  },
  collections: { slug: string; name?: string | null }[],
) {
  const override = BY_SLUG.get(row.slug);
  if (!override) {
    return {
      conditionType: row.conditionType,
      threshold: row.threshold,
      collectionSlug: row.collectionSlug ?? null,
    };
  }

  return {
    conditionType: override.conditionType,
    threshold: override.threshold,
    collectionSlug: override.collectionSlug
      ? resolveNyappoleonSlug(collections)
      : null,
  };
}

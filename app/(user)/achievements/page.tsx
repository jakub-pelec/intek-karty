import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  achievementProgress,
  loadAchievementEvalState,
} from "@/db/queries/achievements";
import { achievements, userAchievements } from "@/db/schema";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { TitlesCatalog } from "@/components/titles-catalog";
import { achievementSpec } from "@/lib/achievements/spec";
import { liveCms } from "@/lib/cms/live";
import { requireUser } from "@/lib/rbac";
import { toRoman } from "@/lib/ritual";
import { formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AchievementsPage() {
  const user = await requireUser();
  const db = getDb();
  const [t, locale, catalog, unlocked, evalState] = await Promise.all([
    getTranslations("titles"),
    getLocale(),
    db.select().from(achievements).where(liveCms(achievements)),
    db.select().from(userAchievements).where(eq(userAchievements.userId, user.id)),
    loadAchievementEvalState(user.id),
  ]);
  const byId = new Map(unlocked.map((row) => [row.achievementId, row]));

  const completed = catalog.filter((row) => byId.has(row.id)).length;
  const rows = catalog
    .map((achievement) => {
      const got = byId.get(achievement.id);
      const spec = achievementSpec(achievement, evalState.collectionMeta);
      const progress = achievementProgress(
        spec.conditionType,
        spec.threshold,
        evalState.state,
        spec.collectionSlug,
      );
      const ratio =
        progress.required <= 0
          ? 0
          : Math.min(1, progress.current / progress.required);
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        meta:
          got
            ? t("unlockedMeta", {
                date: formatDate(got.unlockedAt, locale),
                points: achievement.pointReward,
              })
            : t("echoesMeta", { points: achievement.pointReward }),
        done: Boolean(got),
        current: progress.current,
        required: progress.required,
        ratio,
      };
    })
    .sort((a, b) => {
      if (b.ratio !== a.ratio) return b.ratio - a.ratio;
      if (a.done !== b.done) return Number(b.done) - Number(a.done);
      return a.name.localeCompare(b.name, locale);
    });

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title={t("title")}
        eyebrow={t("eyebrow", {
          completed: toRoman(completed),
          total: toRoman(catalog.length),
        })}
      />
      <TitlesCatalog rows={rows} />
    </main>
  );
}

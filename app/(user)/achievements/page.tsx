import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { achievements, userAchievements } from "@/db/schema";
import { evaluateAchievementsForUser } from "@/db/queries/achievements";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { liveCms } from "@/lib/cms/live";
import { requireUser } from "@/lib/rbac";
import { toRoman } from "@/lib/ritual";
import { cn, formatDate } from "@/lib/utils";

export default async function AchievementsPage() {
  const user = await requireUser();
  await evaluateAchievementsForUser(user.id);

  const db = getDb();
  const catalog = await db.select().from(achievements).where(liveCms(achievements));
  const unlocked = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, user.id));
  const byId = new Map(unlocked.map((row) => [row.achievementId, row]));

  const completed = catalog.filter((row) => byId.has(row.id)).length;

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title="Titles"
        eyebrow={`${toRoman(completed)} of ${toRoman(catalog.length)} bestowed`}
      />
      <ul className="border border-[#d4b36a]/30 bg-[#0c0b12] px-6">
        {catalog.map((achievement) => {
          const got = byId.get(achievement.id);
          const done = Boolean(got);
          return (
            <li
              key={achievement.id}
              className="border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  className={cn(
                    "font-[family-name:var(--font-cormorant)] text-[26px] italic",
                    done ? "text-[#f3efe6]" : "text-[#d7d3c8]",
                  )}
                >
                  {achievement.name}
                </h2>
                <span
                  className={cn(
                    "shrink-0 font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] uppercase",
                    done ? "text-[#d4b36a]" : "text-[#d7d3c8]",
                  )}
                >
                  {done ? "Bestowed" : "Sealed"}
                </span>
              </div>
              <p className="mt-2 text-lg leading-relaxed text-[#d7d3c8]">
                {achievement.description}
              </p>
              <p className="mt-3 font-[family-name:var(--font-cinzel)] text-xs tracking-[0.12em] text-[#cfc6b4] uppercase">
                {done && got
                  ? `${formatDate(got.unlockedAt)} · ${achievement.pointReward} echoes`
                  : `${achievement.pointReward} echoes`}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

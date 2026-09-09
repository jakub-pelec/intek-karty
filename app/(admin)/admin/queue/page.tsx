import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { boosterTypes, userBoosters, users } from "@/db/schema";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty } from "@/components/sanctum";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";

export default async function QueuePage() {
  const db = getDb();
  const rows = await db
    .select({
      id: userBoosters.id,
      createdAt: userBoosters.createdAt,
      twitchId: userBoosters.twitchId,
      note: userBoosters.note,
      userName: users.name,
      boosterName: boosterTypes.name,
    })
    .from(userBoosters)
    .leftJoin(users, eq(userBoosters.userId, users.id))
    .innerJoin(boosterTypes, eq(userBoosters.boosterTypeId, boosterTypes.id))
    .where(eq(userBoosters.status, "pending"))
    .orderBy(asc(userBoosters.createdAt));

  const [t, locale] = await Promise.all([
    getTranslations("queue"),
    getLocale(),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title={t("title")}
        eyebrow={rows.length ? t("waiting", { count: rows.length }) : t("noneWaiting")}
      />
      {rows.length === 0 ? (
        <SanctumEmpty>{t("empty")}</SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-4 border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-cormorant)] text-[24px] text-[#f3efe6] italic">
                    {row.userName ?? `twitch:${row.twitchId}`}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                    {row.boosterName}
                    {row.note ? ` · ${row.note}` : ""}
                    {` · ${formatDate(row.createdAt, locale)}`}
                  </p>
                </div>
                <Link
                  href={`/admin/open/${row.id}`}
                  className={cn(buttonVariants(), "shrink-0")}
                >
                  {t("open")}
                </Link>
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}
    </main>
  );
}

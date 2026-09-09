import Link from "next/link";
import { listUsers } from "@/db/queries/admin";
import { AdminUserSearch } from "@/components/admin-user-search";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty, SanctumPager } from "@/components/sanctum";
import { getTranslations } from "next-intl/server";
function usersHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin/users?${search}` : "/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: rawPage } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(rawPage ?? 1) || 1);
  const { rows, total, hasMore } = await listUsers(query, page);
  const t = await getTranslations("users");

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader
        title={t("title")}
        eyebrow={
          query
            ? t("matching", { total })
            : t("inLedger", { total })
        }
      />
      <SanctumCard className="mb-6">
        <AdminUserSearch query={query} />
      </SanctumCard>
      {rows.length === 0 ? (
        <SanctumEmpty>
          {query ? t("noMatch") : t("none")}
        </SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {rows.map((user) => (
              <li key={user.id} className="border-b border-[#d7d3c8]/15 last:border-b-0">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center justify-between gap-4 py-5"
                >
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-cormorant)] text-[24px] text-[#f3efe6] italic">
                      {user.name}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-cinzel)] text-[13px] tracking-[0.16em] text-[#d7d3c8]/60 uppercase">
                      {t("roleEchoes", { role: user.role, points: user.pointsBalance })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}
      <SanctumPager
        prevHref={page > 1 ? usersHref(query, page - 1) : null}
        nextHref={hasMore ? usersHref(query, page + 1) : null}
      />
    </main>
  );
}

import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db";
import { boosterTypes, draws, users } from "@/db/schema";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty } from "@/components/sanctum";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MutationBadges, RarityBadge } from "@/components/ui/badge";
import { liveCms } from "@/lib/cms/live";
import { PAGE_SIZE } from "@/lib/constants";
import { formatCardNumber, formatDate } from "@/lib/utils";

function drawsHref(
  params: { user?: string; booster?: string; from?: string; to?: string },
  page: number,
) {
  const query = new URLSearchParams();
  if (params.user) query.set("user", params.user);
  if (params.booster) query.set("booster", params.booster);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `/admin/history?${search}` : "/admin/history";
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    user?: string;
    booster?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const db = getDb();
  const types = await db.select().from(boosterTypes).where(liveCms(boosterTypes));

  const filters = [];
  if (params.user) {
    filters.push(sql`${draws.viewerName} ilike ${"%" + params.user + "%"}`);
  }
  if (params.booster) filters.push(eq(draws.boosterTypeId, params.booster));
  if (params.from) filters.push(gte(draws.createdAt, new Date(params.from)));
  if (params.to) filters.push(lte(draws.createdAt, new Date(params.to)));

  const where = filters.length ? and(...filters) : undefined;

  const rows = await db
    .select({
      id: draws.id,
      createdAt: draws.createdAt,
      cardName: draws.cardName,
      cardNumber: draws.cardNumber,
      cardRarity: draws.cardRarity,
      holographic: draws.holographic,
      signature: draws.signature,
      isDuplicate: draws.isDuplicate,
      viewerName: draws.viewerName,
      boosterName: boosterTypes.name,
      triggeredByName: users.name,
    })
    .from(draws)
    .leftJoin(boosterTypes, eq(draws.boosterTypeId, boosterTypes.id))
    .leftJoin(users, eq(draws.triggeredBy, users.id))
    .where(where)
    .orderBy(desc(draws.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const hasMore = rows.length === PAGE_SIZE;

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader title="Draws" eyebrow="Every open and grant" />
      <form className="mb-10 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Viewer</Label>
          <Input name="user" defaultValue={params.user} />
        </div>
        <div>
          <Label>Booster</Label>
          <Select name="booster" defaultValue={params.booster ?? ""}>
            <option value="">All</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>From</Label>
          <Input name="from" type="date" defaultValue={params.from} />
        </div>
        <div>
          <Label>To</Label>
          <Input name="to" type="date" defaultValue={params.to} />
        </div>
        <Button type="submit" className="sm:col-span-2 w-fit">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <SanctumEmpty>No manifestations match.</SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {rows.map((row) => (
              <li
                key={row.id}
                className="border-b border-[#d7d3c8]/15 py-5 last:border-b-0"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-[family-name:var(--font-cormorant)] text-[22px] text-[#f3efe6] italic">
                    {row.viewerName}
                  </p>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[9px] tracking-[0.12em] text-[#cfc6b4] uppercase">
                    {formatDate(row.createdAt)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-[17px] text-[#d7d3c8]/80 italic">
                    {formatCardNumber(row.cardNumber)} {row.cardName}
                    {row.isDuplicate ? (
                      <span className="ml-1 font-[family-name:var(--font-cinzel)] text-[9px] text-[#d4b36a]/60 not-italic uppercase">
                        (Echo)
                      </span>
                    ) : null}
                  </span>
                  <RarityBadge rarity={row.cardRarity} />
                  <MutationBadges
                    holographic={row.holographic}
                    signature={row.signature}
                  />
                </div>
                <p className="mt-2 font-[family-name:var(--font-cinzel)] text-[10px] tracking-[0.16em] text-[#d7d3c8]/45 uppercase">
                  {row.boosterName ?? "Manual"} · {row.triggeredByName}
                </p>
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}

      {page > 1 || hasMore ? (
        <div className="mt-10 flex justify-center gap-10">
          {page > 1 ? (
            <Link
              href={drawsHref(params, page - 1)}
              className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
            >
              Previous
            </Link>
          ) : null}
          {hasMore ? (
            <Link
              href={drawsHref(params, page + 1)}
              className="font-[family-name:var(--font-cinzel)] text-[12px] tracking-[0.2em] text-[#d7d3c8] uppercase hover:text-[#d4b36a]"
            >
              Next
            </Link>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

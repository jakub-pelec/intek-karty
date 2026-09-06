import Link from "next/link";
import { searchUsers } from "@/db/queries/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RitualPageHeader } from "@/components/ritual-page-header";
import { SanctumCard, SanctumEmpty } from "@/components/sanctum";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = query ? await searchUsers(query) : [];

  return (
    <main className="mx-auto w-full max-w-3xl pt-2 md:pt-6">
      <RitualPageHeader title="Users" eyebrow="Search by Twitch name" />
      <form className="mb-10 flex gap-3">
        <Input name="q" defaultValue={q} placeholder="Twitch username" />
        <Button type="submit">Search</Button>
      </form>
      {!query ? (
        <SanctumEmpty>Enter a name to begin.</SanctumEmpty>
      ) : results.length === 0 ? (
        <SanctumEmpty>No one matches that name.</SanctumEmpty>
      ) : (
        <SanctumCard className="px-6 py-0">
          <ul>
            {results.map((user) => (
              <li key={user.id} className="border-b border-[#d7d3c8]/15 last:border-b-0">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-baseline justify-between gap-4 py-5 hover:text-[#d4b36a]"
                >
                  <span className="font-[family-name:var(--font-cormorant)] text-[22px] text-[#f3efe6] italic">
                    {user.name}
                  </span>
                  <span className="shrink-0 font-[family-name:var(--font-cinzel)] text-[11px] tracking-[0.16em] text-[#d7d3c8]/55 uppercase">
                    {user.role} · {user.pointsBalance} echoes
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SanctumCard>
      )}
    </main>
  );
}

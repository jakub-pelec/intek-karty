import { MatchBoard } from "@/components/match-board";
import { getMatchPayload } from "@/db/queries/matches";
import { requireUser } from "@/lib/rbac";
import { getTranslations } from "next-intl/server";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const [payload, t] = await Promise.all([
    getMatchPayload(id, user),
    getTranslations("match"),
  ]);

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-[104rem] px-4 pt-8 pb-16 md:px-8 md:pt-6">
        <h1 className="text-center font-[family-name:var(--font-cormorant)] text-[42px] tracking-wide text-[#cfc6b4] italic md:text-[55px]">
          {t("title")}
        </h1>
        <p className="mt-3 text-center font-[family-name:var(--font-cinzel)] text-[14px] tracking-[0.3em] text-[#d4b36a] uppercase">
          {t("notFound")}
        </p>
      </main>
    );
  }

  const them =
    payload.view.youAre === "b" ? payload.view.playerA : payload.view.playerB;
  const eyebrow =
    payload.view.kind === "practice"
      ? t("vsShade")
      : t("vsPlayer", { name: them.name });

  return (
    <main className="mx-auto w-full max-w-[104rem] px-4 pt-8 pb-16 md:px-8 md:pt-6">
      <MatchBoard payload={payload} eyebrow={eyebrow} />
    </main>
  );
}

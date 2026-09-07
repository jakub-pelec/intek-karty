import { ListPageSkeleton } from "@/components/ritual-skeleton";
import { getTranslations } from "next-intl/server";

export default async function AchievementsLoading() {
  const t = await getTranslations("titles");
  return (
    <ListPageSkeleton
      title={t("title")}
      eyebrow={t("eyebrow", { completed: "III", total: "XII" })}
      kind="titles"
    />
  );
}

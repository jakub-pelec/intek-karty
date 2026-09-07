import { ListPageSkeleton } from "@/components/ritual-skeleton";
import { getTranslations } from "next-intl/server";

export default async function HistoryLoading() {
  const t = await getTranslations("chronicle");
  return (
    <ListPageSkeleton
      title={t("title")}
      eyebrow={t("eyebrow", { points: 40 })}
      tabs
    />
  );
}

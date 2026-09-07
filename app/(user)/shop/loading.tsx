import { ListPageSkeleton } from "@/components/ritual-skeleton";
import { getTranslations } from "next-intl/server";

export default async function ShopLoading() {
  const t = await getTranslations("offerings");
  return (
    <ListPageSkeleton
      title={t("title")}
      eyebrow={t("eyebrow", { points: 40 })}
      cards
    />
  );
}

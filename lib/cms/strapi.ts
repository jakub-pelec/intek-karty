import type {
  StrapiAchievement,
  StrapiBooster,
  StrapiCard,
  StrapiCollection,
  StrapiReward,
} from "@/lib/cms/map-catalog";
import { CmsSyncError } from "@/lib/cms/map-catalog";

type ListResponse<T> = {
  data?: T[];
  meta?: { pagination?: { page: number; pageCount: number } };
};

export function cmsEnv() {
  const strapiUrl = process.env.STRAPI_URL?.replace(/\/$/, "");
  const token = process.env.STRAPI_TOKEN;
  if (!strapiUrl || !token) {
    throw new CmsSyncError("STRAPI_URL and STRAPI_TOKEN are required");
  }
  return { strapiUrl, token };
}

async function fetchPages<T>(
  path: string,
  query: string,
): Promise<T[]> {
  const { strapiUrl, token } = cmsEnv();
  const rows: T[] = [];
  let page = 1;
  let pageCount = 1;
  while (page <= pageCount) {
    const url = `${strapiUrl}${path}?${query}&pagination[page]=${page}&pagination[pageSize]=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new CmsSyncError(`Strapi ${path} failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as ListResponse<T>;
    rows.push(...(json.data ?? []));
    pageCount = json.meta?.pagination?.pageCount ?? 1;
    page += 1;
  }
  return rows;
}

export async function fetchCatalogFromStrapi() {
  const cardQuery =
    "status=published&populate[image]=true&populate[holoMap]=true&populate[collection]=true";
  const cardQueryLegacy =
    "status=published&populate[image]=true&populate[collection]=true";

  const [collections, cards, boosters, achievements, rewards] = await Promise.all([
    fetchPages<StrapiCollection>(
      "/api/collections",
      "status=published&populate[backImage]=true",
    ),
    fetchPages<StrapiCard>("/api/cards", cardQuery).catch((error) => {
      if (
        error instanceof CmsSyncError &&
        error.message.includes("Invalid key holoMap")
      ) {
        return fetchPages<StrapiCard>("/api/cards", cardQueryLegacy);
      }
      throw error;
    }),
    fetchPages<StrapiBooster>(
      "/api/boosters",
      "status=published&populate[collection]=true&populate[frontImage]=true&populate[backImage]=true&populate[dropRates]=true",
    ),
    fetchPages<StrapiAchievement>("/api/achievements", "status=published"),
    fetchPages<StrapiReward>("/api/rewards", "status=published"),
  ]);
  return { collections, cards, boosters, achievements, rewards };
}

import "../db/load-env";
import {
  ENGLISH_SEED_SLUGS,
  NYAPPOLEON_SLUG,
  prodAchievements,
  resolveNyappoleonSlug,
  type ProdAchievement,
} from "@/db/seed-data/prod-achievements";
import { cmsEnv } from "@/lib/cms/strapi";

type StrapiEntry = {
  documentId: string;
  slug?: string;
  name?: string;
};

type ListResponse = {
  data?: StrapiEntry[];
  error?: { message?: string };
  meta?: { pagination?: { page: number; pageCount: number } };
};

async function strapiFetch(path: string, init?: RequestInit) {
  const { strapiUrl, token } = cmsEnv();
  const res = await fetch(`${strapiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: ListResponse & Record<string, unknown> = {};
  try {
    json = text ? (JSON.parse(text) as ListResponse) : {};
  } catch {
    json = { error: { message: text } };
  }
  if (!res.ok) {
    throw new Error(
      `Strapi ${init?.method ?? "GET"} ${path} failed: ${res.status} ${json.error?.message ?? text}`,
    );
  }
  return json;
}

async function listAll(path: string) {
  const rows: StrapiEntry[] = [];
  for (const status of ["published", "draft"] as const) {
    let page = 1;
    let pageCount = 1;
    while (page <= pageCount) {
      const json = await strapiFetch(
        `${path}?status=${status}&pagination[page]=${page}&pagination[pageSize]=100`,
      );
      rows.push(...(json.data ?? []));
      pageCount = json.meta?.pagination?.pageCount ?? 1;
      page += 1;
    }
  }
  const byId = new Map<string, StrapiEntry>();
  for (const row of rows) byId.set(row.documentId, row);
  return [...byId.values()];
}

function strapiCondition(title: ProdAchievement): {
  conditionType: "first_joker" | "cards_collected_threshold" | "full_collection";
  threshold: number | null;
} {
  if (title.conditionType === "first_joker") {
    return { conditionType: "first_joker", threshold: null };
  }
  if (
    title.conditionType === "collection_complete" ||
    title.conditionType === "collection_holo_complete"
  ) {
    return { conditionType: "full_collection", threshold: null };
  }
  return {
    conditionType: "cards_collected_threshold",
    threshold: title.threshold,
  };
}

function payload(title: ProdAchievement) {
  const condition = strapiCondition(title);
  return {
    name: title.name,
    slug: title.slug,
    description: title.description,
    conditionType: condition.conditionType,
    threshold: condition.threshold,
    pointReward: title.pointReward,
    active: true,
  };
}

async function upsertTitle(title: ProdAchievement, existing: StrapiEntry | undefined) {
  if (existing) {
    await strapiFetch(`/api/achievements/${existing.documentId}?status=published`, {
      method: "PUT",
      body: JSON.stringify({ data: payload(title) }),
    });
    return existing.documentId;
  }
  const created = await strapiFetch("/api/achievements?status=published", {
    method: "POST",
    body: JSON.stringify({ data: payload(title) }),
  });
  const documentId = (created.data as StrapiEntry | undefined)?.documentId;
  if (!documentId) throw new Error(`Create did not return documentId for ${title.slug}`);
  return documentId;
}

async function unpublish(documentId: string) {
  await strapiFetch(`/api/achievements/${documentId}/actions/unpublish`, {
    method: "POST",
  });
}

const PROD_STRAPI = "https://cms-production-3078.up.railway.app";

async function main() {
  if (process.argv.includes("--prod")) {
    process.env.STRAPI_URL = PROD_STRAPI;
  }

  const collections = await listAll("/api/collections");
  const nyappoleonSlug = resolveNyappoleonSlug(
    collections.map((row) => ({ slug: row.slug ?? "", name: row.name })),
  );
  if (nyappoleonSlug === NYAPPOLEON_SLUG && !collections.some((row) => row.slug === NYAPPOLEON_SLUG)) {
    console.warn(
      `Nyappoleon collection is not in Strapi yet; mini titles will use slug "${NYAPPOLEON_SLUG}".`,
    );
  }

  const titles = prodAchievements(nyappoleonSlug);
  const existing = await listAll("/api/achievements");
  const bySlug = new Map(existing.map((row) => [row.slug, row]));

  for (const title of titles) {
    const documentId = await upsertTitle(title, bySlug.get(title.slug));
    console.log(`published ${title.slug} (${documentId})`);
  }

  for (const slug of ENGLISH_SEED_SLUGS) {
    const row = bySlug.get(slug);
    if (!row) continue;
    try {
      await unpublish(row.documentId);
      console.log(`unpublished leftover ${slug}`);
    } catch (error) {
      console.warn(`could not unpublish ${slug}:`, error);
    }
  }

  console.log(`Nyappoleon slug: ${nyappoleonSlug}`);
  console.log(`Achievements published: ${titles.length}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

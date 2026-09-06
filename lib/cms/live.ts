import { type Column, and, eq, isNotNull } from "drizzle-orm";

export type CmsCatalogRow = {
  active: boolean;
  cmsId: string | null;
};

export function isLiveCmsRow(row: CmsCatalogRow) {
  return row.active && Boolean(row.cmsId);
}

export function liveCms(table: { active: Column; cmsId: Column }) {
  return and(eq(table.active, true), isNotNull(table.cmsId));
}

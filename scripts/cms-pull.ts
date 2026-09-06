import "../db/load-env";
import { closeDb } from "@/db";
import { CmsSyncError } from "@/lib/cms/map-catalog";
import { syncCatalogFromStrapi } from "@/lib/cms/sync-catalog";

async function main() {
  try {
    const counts = await syncCatalogFromStrapi();
    console.log("Catalog pulled from Strapi:");
    console.log(`  collections:   ${counts.collections}`);
    console.log(`  cards:         ${counts.cards}`);
    console.log(`  boosters:      ${counts.boosters}`);
    console.log(`  achievements:  ${counts.achievements}`);
    console.log(`  rewards:       ${counts.rewards}`);
  } catch (error) {
    if (error instanceof CmsSyncError) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    await closeDb().catch(() => undefined);
  }
}

void main();

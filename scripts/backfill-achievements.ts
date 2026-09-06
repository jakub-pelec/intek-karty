import "../db/load-env";
import { closeDb, getDb } from "@/db";
import { evaluateAchievementsForUser } from "@/db/queries/achievements";
import { users } from "@/db/schema";

async function main() {
  const rows = await getDb().select({ id: users.id, name: users.name }).from(users);
  let unlocked = 0;
  for (const row of rows) {
    const grants = await evaluateAchievementsForUser(row.id);
    unlocked += grants.length;
    if (grants.length) {
      console.log(`${row.name}: ${grants.map((grant) => grant.name).join(", ")}`);
    }
  }
  console.log(`Users checked: ${rows.length}`);
  console.log(`Titles granted: ${unlocked}`);
}

void main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => closeDb().catch(() => undefined));

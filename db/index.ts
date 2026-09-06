import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  pg: ReturnType<typeof postgres> | undefined;
  db: Database | undefined;
};

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!globalForDb.pg) {
    const supabase = url.includes("supabase.co");
    globalForDb.pg = postgres(url, {
      max: 10,
      prepare: false,
      ssl: supabase ? "require" : undefined,
    });
  }

  if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.pg, { schema });
  }

  return globalForDb.db;
}

export async function closeDb() {
  if (globalForDb.pg) {
    await globalForDb.pg.end();
    globalForDb.pg = undefined;
    globalForDb.db = undefined;
  }
}

import { cpSync, existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const persist = process.env.RAILWAY_VOLUME_MOUNT_PATH || "/persist";
const persistUploads = path.join(persist, "uploads");
const persistDb = path.join(persist, "data.db");
const localDb = path.join(process.cwd(), "data", "data.db");
const localUploads = path.join(process.cwd(), "public", "uploads");

mkdirSync(persist, { recursive: true });
mkdirSync(persistUploads, { recursive: true });

const seedPersist = process.env.SEED_PERSIST === "1";
if (existsSync(localDb) && (seedPersist || !existsSync(persistDb))) {
  cpSync(localDb, persistDb);
}

if (!process.env.DATABASE_FILENAME) {
  process.env.DATABASE_FILENAME = persistDb;
}

if (existsSync(localUploads) && !lstatSync(localUploads).isSymbolicLink()) {
  cpSync(localUploads, persistUploads, {
    recursive: true,
    force: seedPersist,
  });
  rmSync(localUploads, { recursive: true, force: true });
} else if (existsSync(localUploads)) {
  rmSync(localUploads, { force: true });
}

symlinkSync(persistUploads, localUploads, "dir");

const child = spawn("pnpm", ["exec", "strapi", "start"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 1));

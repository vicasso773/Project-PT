// Creates/updates the tables in your Turso database.  Usage:  npm run db:turso
// Reads TURSO_DATABASE_URL and TURSO_AUTH_TOKEN from .env.local. Safe to run again: it skips what's done.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) in .env.local first. See README.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
await db.execute("CREATE TABLE IF NOT EXISTS _pt_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
const done = new Set((await db.execute("SELECT name FROM _pt_migrations")).rows.map((r) => String(r.name)));

const dirs = readdirSync("prisma/migrations", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
for (const name of dirs) {
  if (done.has(name)) {
    console.log(`✔ ${name} (already applied)`);
    continue;
  }
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  await db.executeMultiple(sql);
  await db.execute({ sql: "INSERT INTO _pt_migrations (name, applied_at) VALUES (?, ?)", args: [name, new Date().toISOString()] });
  console.log(`✔ ${name} applied`);
}
console.log("Turso database is ready.");

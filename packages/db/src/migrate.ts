import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(databaseUrl, { max: 1 });
const migrationPath = join(dirname(fileURLToPath(import.meta.url)), "migrations", "001_initial.sql");
const migrationSql = readFileSync(migrationPath, "utf8");

await sql.unsafe(migrationSql);
await sql.end();

console.log("Migration 001_initial applied successfully.");

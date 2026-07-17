import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptRoot, "../../..");
loadEnvFile(join(repoRoot, ".env"));
loadEnvFile(join(repoRoot, "apps/api/.env"));

const { applyMigrations } = await import("@vsn/db");

const migrationsDir = join(repoRoot, "packages/db/src/migrations");
const migrations = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => ({
    id: name.replace(/\.sql$/, ""),
    sql: readFileSync(join(migrationsDir, name), "utf8")
  }));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const sql = postgres(databaseUrl, { max: 1 });
  await applyMigrations(sql, migrations);
  await sql.end();
  console.log("Migrations applied via schema_migrations ledger");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

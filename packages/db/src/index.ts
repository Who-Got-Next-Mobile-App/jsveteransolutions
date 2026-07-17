import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { applyMigrations } from "./migrator";
export type { MigrationFile } from "./migrator";

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

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

function loadLocalEnv() {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return;

  try {
    const packageRoot = dirname(fileURLToPath(import.meta.url));
    const repoRoot = join(packageRoot, "../..");
    loadEnvFile(join(repoRoot, ".env"));
    loadEnvFile(join(repoRoot, "apps/api/.env"));
  } catch {
    // import.meta may be unavailable in some bundled targets
  }
}

loadLocalEnv();

export function getDb() {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgresql://jsvs:jsvs_dev_password@localhost:5432/jsvs";

  if (!client) {
    const useSsl =
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || process.env.DATABASE_SSL === "true";
    client = postgres(databaseUrl, {
      max: process.env.AWS_LAMBDA_FUNCTION_NAME ? 1 : 10,
      ssl: useSsl ? "require" : undefined
    });
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance!;
}

export async function closeDb() {
  if (client) {
    await client.end();
    client = null;
    dbInstance = null;
  }
}

import "./env.js";
import { handle } from "hono/aws-lambda";
import postgres from "postgres";
import { applyMigrations } from "@vsn/db";
import { createApp } from "./app";
import initialMigrationSql from "../../../packages/db/src/migrations/001_initial.sql";
import portalFeaturesMigrationSql from "../../../packages/db/src/migrations/002_native_portal_features.sql";
import providerSelfServeMigrationSql from "../../../packages/db/src/migrations/003_provider_self_serve.sql";
import referralSubmissionsMigrationSql from "../../../packages/db/src/migrations/004_referral_submissions.sql";

let migrated = false;

async function ensureMigrated() {
  if (migrated || !process.env.AWS_LAMBDA_FUNCTION_NAME) return;
  if (process.env.RUN_MIGRATIONS !== "true") return;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  const sql = postgres(databaseUrl, { max: 1, ssl: "require" });
  try {
    await applyMigrations(sql, [
      { id: "001_initial", sql: initialMigrationSql },
      { id: "002_native_portal_features", sql: portalFeaturesMigrationSql },
      { id: "003_provider_self_serve", sql: providerSelfServeMigrationSql },
      { id: "004_referral_submissions", sql: referralSubmissionsMigrationSql }
    ]);
    migrated = true;
  } finally {
    await sql.end();
  }
}

const app = createApp();

export const handler = async (event: unknown, context: unknown) => {
  await ensureMigrated();
  return handle(app)(event, context);
};

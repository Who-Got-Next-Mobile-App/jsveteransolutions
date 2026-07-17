import type postgres from "postgres";

export interface MigrationFile {
  id: string;
  sql: string;
}

export async function applyMigrations(sql: ReturnType<typeof postgres>, migrations: MigrationFile[]) {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  for (const migration of migrations) {
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM schema_migrations WHERE id = ${migration.id}
    `;
    if (existing.length > 0) continue;

    if (migration.id === "001_initial") {
      const tables = await sql<{ exists: string | null }[]>`
        SELECT to_regclass('public.user_accounts') AS exists
      `;
      if (tables[0]?.exists) {
        await sql`INSERT INTO schema_migrations (id) VALUES (${migration.id}) ON CONFLICT DO NOTHING`;
        continue;
      }
    }

    await sql.unsafe(migration.sql);
    await sql`INSERT INTO schema_migrations (id) VALUES (${migration.id}) ON CONFLICT DO NOTHING`;
  }
}

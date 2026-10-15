import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

/**
 * Pool de conexões PostgreSQL.
 * A URL vem de DATABASE_URL (ver server/.env.example).
 */

const here = dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://conecta@127.0.0.1:5432/conecta",
  max: 10,
});

/** Executa uma query tipada. */
export async function query<T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(sql, params as never[]);
  return result.rows as T[];
}

/** Executa uma query que retorna no máximo uma linha. */
export async function queryOne<T = unknown>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** (Re)cria o schema a partir de schema.sql. */
export async function migrate(): Promise<void> {
  const sql = readFileSync(join(here, "schema.sql"), "utf8");
  await pool.query(sql);
}

/** Popula o banco com os dados de demonstração (seed.sql). */
export async function seed(): Promise<void> {
  const sql = readFileSync(join(here, "seed.sql"), "utf8");
  await pool.query(sql);
}

/** Recria o schema e injeta o seed — usado em dev e nos testes. */
export async function resetAndSeed(): Promise<void> {
  await migrate();
  await seed();
}

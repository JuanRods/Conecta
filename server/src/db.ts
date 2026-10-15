import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { loadEnv } from "./env.js";

/**
 * Pool de conexões PostgreSQL.
 *
 * A conexão pode ser definida de duas formas (ver server/.env.example):
 *  - DATABASE_URL completa, ou
 *  - variáveis separadas PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD.
 *
 * As variáveis separadas são úteis quando a senha tem caracteres especiais
 * (ex.: "@"), que precisariam ser codificados numa URL.
 */

loadEnv();

const here = dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: resolveConnectionString(),
  max: 10,
});

/** Monta a connection string a partir do ambiente, com fallback para dev. */
function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.PGHOST ?? "localhost";
  const port = process.env.PGPORT ?? "5432";
  const database = process.env.PGDATABASE ?? "postgres";
  const user = process.env.PGUSER ?? "postgres";
  const password = process.env.PGPASSWORD ?? "";

  // Codifica usuário e senha para suportar caracteres especiais (@, :, /, …).
  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}@`
    : `${encodeURIComponent(user)}@`;

  return `postgres://${auth}${host}:${port}/${database}`;
}

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

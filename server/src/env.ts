import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Carregador leve de variáveis de ambiente a partir de `server/.env`
 * (sem dependências externas).
 *
 * - Não sobrescreve variáveis já definidas no processo (precedência do shell).
 * - Ignora linhas em branco e comentários (`#`).
 * - Suporta valores entre aspas simples ou duplas.
 *
 * Procura o arquivo `.env` na raiz do pacote `server/` (dois níveis acima
 * deste arquivo compilado: server/src -> server).
 */
export function loadEnv(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = join(here, "..", ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    // Remove aspas envolventes, se houver.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

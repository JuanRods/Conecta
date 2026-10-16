#!/usr/bin/env node
/**
 * Garante que as dependências da API (pasta server/) estejam instaladas.
 *
 * Por que isto existe: as dependências do frontend (raiz) e da API (server/)
 * são instaladas separadamente. É comum rodar apenas `npm install` na raiz e
 * depois `npm run api` falhar com "'tsx' não é reconhecido" / "tsx: not found",
 * porque server/node_modules nunca foi criado.
 *
 * Este script roda ANTES de `api`, `db:*` e `test:api` (via hooks pre*). Se as
 * dependências da API estiverem faltando, ele executa `npm install` em server/
 * automaticamente. É multiplataforma (Windows/macOS/Linux) e sem dependências.
 */
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const serverDir = join(here, "..", "server");

// `tsx` é o runner usado por todos os scripts da API; sua presença no .bin
// indica que `npm install` já rodou em server/.
const tsxBin = join(
  serverDir,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);

if (existsSync(tsxBin)) {
  process.exit(0);
}

console.log(
  "[setup] Dependências da API ausentes em server/. Instalando (npm install)…",
);

// npm no Windows é npm.cmd; shell:true resolve o executável correto.
const result = spawnSync("npm", ["install"], {
  cwd: serverDir,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  console.error(
    "[setup] Falha ao instalar as dependências da API. " +
      "Rode manualmente: npm run api:install",
  );
  process.exit(result.status ?? 1);
}

console.log("[setup] Dependências da API instaladas com sucesso.");

import "@testing-library/jest-dom/vitest";
import { expect, beforeAll, afterAll } from "vitest";
import { toHaveNoViolations } from "jest-axe";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import type { Server } from "node:http";

// Habilita o matcher de acessibilidade axe nos testes (Fase 1.6 / NF1)
expect.extend(toHaveNoViolations);

/**
 * Harness de integração: sobe o BACKEND REAL (Express + SQLite) em um banco
 * temporário e aponta o cliente HTTP do frontend para ele. Assim os testes
 * exercitam o caminho completo (componente → serviço → HTTP → Express → SQLite),
 * validando que o app "conversa com o banco de dados" de verdade.
 *
 * Cada `localStorage.clear()` dos testes também reseta e re-semeia o banco,
 * preservando o isolamento que os testes esperam.
 */

let server: Server;
let dataDir: string;

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "conecta-test-"));
  process.env.CONECTA_DATA_DIR = dataDir;
  process.env.CONECTA_DB_FILE = path.join(dataDir, "test.sqlite");
  process.env.CONECTA_TEST_RESET = "1";
  process.env.CONECTA_JWT_SECRET = "test-secret";
  process.env.CONECTA_SENSITIVE_KEY = "test-sensitive-key";

  // Especificadores em variável para que o tsc não tente tipar os módulos JS do
  // backend (eles rodam só no harness de testes, via Vite/vitest em runtime).
  const serverDir = "../../server/src";
  const { createApp } = await import(/* @vite-ignore */ `${serverDir}/app.js`);
  const { resetDatabase, db } = await import(
    /* @vite-ignore */ `${serverDir}/db.js`
  );
  const { seed } = await import(/* @vite-ignore */ `${serverDir}/seed.js`);
  const app = createApp();

  // Expõe uma consulta ao banco para os testes de "criptografia em repouso"
  // (verificar que o bloco sensível não fica em texto puro no SQLite).
  (globalThis as { __conectaDb__?: unknown }).__conectaDb__ = db;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 4000;
  const base = `http://127.0.0.1:${port}`;

  // Injeta a base URL que o cliente HTTP lê. Usamos um global dedicado porque o
  // client.ts lê import.meta.env no load do módulo (antes deste beforeAll).
  (globalThis as { __CONECTA_API_URL__?: string }).__CONECTA_API_URL__ = base;

  // Reseta o banco a cada limpeza de localStorage usada pelos testes. Como o
  // backend roda no MESMO processo, reciclamos o banco direto (síncrono via
  // better-sqlite3) em vez de uma chamada HTTP — evitando bloquear o event loop.
  const originalClear = Storage.prototype.clear;
  Storage.prototype.clear = function patchedClear(this: Storage) {
    originalClear.call(this);
    try {
      resetDatabase();
      seed();
    } catch {
      /* ignora */
    }
  };
});

afterAll(async () => {
  if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
});

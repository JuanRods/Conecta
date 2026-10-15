import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração de testes E2E (Fase 7 — 7.1 / NF5).
 *
 * Os testes rodam contra o servidor de desenvolvimento do Vite. Em uma máquina
 * com browsers do Playwright instalados:
 *   npm install
 *   npx playwright install --with-deps
 *   npm run test:e2e
 *
 * A suíte inclui um fluxo navegável SOMENTE por teclado (A2) e cobre perfis
 * diferentes (visitante, candidato, empresa).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

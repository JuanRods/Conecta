/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: "127.0.0.1",
    port: 5173,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    // Testes unitários/a11y ficam em src/; os E2E (Playwright) ficam em e2e/.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    // O backend real (Express + SQLite) é montado em memória pelo harness; o
    // better-sqlite3 é um módulo nativo e deve ser externalizado (não transformado).
    server: {
      deps: {
        external: ["better-sqlite3"],
      },
    },
  },
});

import { test, expect } from "@playwright/test";

/**
 * Fluxo do VISITANTE (sem conta): buscar vagas e abrir o detalhe (P2).
 */
test.describe("Busca pública de vagas", () => {
  test("lista vagas aprovadas e abre o detalhe", async ({ page }) => {
    await page.goto("/vagas");

    // Pelo menos uma vaga-semente aprovada deve aparecer.
    const firstJob = page.getByRole("heading", { level: 3 }).first();
    await expect(firstJob).toBeVisible();

    await firstJob.getByRole("link").click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // O visitante vê o botão de candidatura (login só é pedido ao clicar).
    await expect(
      page.getByRole("button", { name: /candidatar-se/i }),
    ).toBeVisible();
  });

  test("candidatar-se sem conta leva ao login (P2.3)", async ({ page }) => {
    await page.goto("/vagas");
    await page.getByRole("heading", { level: 3 }).first().getByRole("link").click();
    await page.getByRole("button", { name: /candidatar-se/i }).click();
    await expect(page.getByRole("heading", { name: /^entrar$/i })).toBeVisible();
  });
});

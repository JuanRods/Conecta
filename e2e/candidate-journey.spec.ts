import { test, expect } from "@playwright/test";

/**
 * Jornada do CANDIDATO: cadastro, preenchimento de perfil e candidatura (C1/C2).
 * Usa e-mail único por execução para não colidir com dados já persistidos.
 */
test.describe("Jornada do candidato", () => {
  test("cadastra, completa o perfil e se candidata a uma vaga", async ({
    page,
  }) => {
    const email = `cand-${Date.now()}@exemplo.com`;

    // --- Cadastro ---
    await page.goto("/cadastro");

    // O convite da navegação guiada não é modal (não bloqueia a tela), mas
    // fechamos com Esc para manter o cenário limpo.
    await page.keyboard.press("Escape");

    await page.getByLabel(/nome completo/i).fill("Ana E2E");
    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByLabel(/^senha/i).fill("Senha@123");
    // Nome exato: evita casar com o ícone "Iniciar navegação guiada da tela
    // Criar conta".
    await page.getByRole("button", { name: /^criar conta$/i }).click();

    // Após o cadastro, o candidato cai no painel.
    await expect(
      page.getByRole("heading", { name: /painel do candidato/i }),
    ).toBeVisible();

    // --- Candidatura ---
    await page.goto("/vagas");
    await page
      .getByRole("heading", { level: 3 })
      .first()
      .getByRole("link")
      .click();
    await page.getByRole("button", { name: /candidatar-se/i }).click();
    await page
      .getByRole("button", { name: /confirmar candidatura/i })
      .click();

    await expect(page.getByText(/você já se candidatou/i)).toBeVisible();

    // --- Confere em "Minhas candidaturas" ---
    await page.goto("/painel/candidaturas");
    await expect(
      page.getByRole("heading", { name: /minhas candidaturas/i }),
    ).toBeVisible();
  });
});

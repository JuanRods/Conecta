import { test, expect } from "@playwright/test";

/**
 * Navegação SOMENTE por teclado (A2 / NF5).
 * Verifica o skip link e a operação dos controles sem usar o mouse.
 */
test.describe("Navegação por teclado", () => {
  test("skip link leva ao conteúdo principal", async ({ page }) => {
    await page.goto("/");

    // O primeiro Tab deve focar o link "Pular para o conteúdo".
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", {
      name: /pular para o conteúdo principal/i,
    });
    await expect(skip).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo-principal")).toBeFocused();
  });

  test("alterna o tema pelo teclado", async ({ page }) => {
    await page.goto("/");

    // Abre o menu único de acessibilidade pelo teclado…
    const menuButton = page.getByRole("button", {
      name: /abrir menu de acessibilidade/i,
    });
    await menuButton.focus();
    await page.keyboard.press("Enter");

    // …e ativa o modo escuro.
    const toggle = page.getByRole("button", { name: /modo escuro/i });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

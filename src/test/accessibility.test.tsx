import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { Layout } from "../components/Layout";

function renderApp() {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={["/"]}>
              <Layout />
            </MemoryRouter>
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>,
  );
}


describe("Base de acessibilidade", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("o layout não possui violações de acessibilidade (axe)", async () => {
    const { container } = renderApp();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('oferece o link "Pular para o conteúdo principal"', () => {
    renderApp();
    expect(
      screen.getByRole("link", { name: /pular para o conteúdo principal/i }),
    ).toBeInTheDocument();
  });

  it("alterna entre tema claro e escuro e persiste a escolha", async () => {
    const user = userEvent.setup();
    renderApp();
    // As preferências ficam agrupadas no menu único de acessibilidade.
    await user.click(
      screen.getByRole("button", { name: /abrir menu de acessibilidade/i }),
    );
    const toggle = screen.getByRole("button", { name: /modo escuro/i });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    await user.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("conecta.prefs")).toContain("dark");
  });

  it("aumenta o tamanho da fonte via controle de preferências", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /abrir menu de acessibilidade/i }),
    );
    const increase = screen.getByRole("button", {
      name: /aumentar tamanho da fonte/i,
    });
    await user.click(increase);
    const scale =
      document.documentElement.style.getPropertyValue("--font-scale");
    expect(Number(scale)).toBeGreaterThan(1);
  });

  it("oferece a navegação guiada ao entrar na tela, com opção de não exibir novamente", async () => {
    renderApp();
    const invite = await screen.findByRole("dialog", {
      name: /quer um guia desta tela/i,
    });
    // O convite NÃO é modal: oferecer o guia não deve prender o foco nem
    // bloquear a leitura da tela.
    expect(invite).not.toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("checkbox", { name: /não exibir novamente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^iniciar navegação guiada$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^cancelar$/i }),
    ).toBeInTheDocument();
  });

  it('"não exibir novamente" impede que o convite reapareça', async () => {
    const user = userEvent.setup();
    const first = renderApp();
    await screen.findByRole("dialog", { name: /quer um guia desta tela/i });

    await user.click(
      screen.getByRole("checkbox", { name: /não exibir novamente/i }),
    );
    await user.click(screen.getByRole("button", { name: /^cancelar$/i }));
    first.unmount();

    // Nova visita à mesma tela: o convite não deve mais aparecer…
    renderApp();
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: /quer um guia desta tela/i }),
      ).not.toBeInTheDocument(),
    );
    // …mas o ícone continua disponível.
    expect(
      screen.getByRole("button", { name: /iniciar navegação guiada da tela/i }),
    ).toBeInTheDocument();
  });

  it("o ícone global inicia a navegação guiada e exibe o primeiro passo", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(
      screen.getByRole("button", { name: /iniciar navegação guiada da tela/i }),
    );
    expect(await screen.findByText(/passo 1 de/i)).toBeInTheDocument();
  });
});

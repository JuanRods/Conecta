import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { Layout } from "../components/Layout";
import { HomePage } from "../pages/HomePage";

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

function renderHome() {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <MemoryRouter>
            <HomePage />
          </MemoryRouter>
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
    const toggle = screen.getByRole("button", { name: /modo escuro/i });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    await user.click(toggle);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("conecta.prefs")).toContain("dark");
  });

  it("aumenta o tamanho da fonte via controle de preferências", async () => {
    const user = userEvent.setup();
    renderApp();
    const increase = screen.getByRole("button", {
      name: /aumentar tamanho da fonte/i,
    });
    await user.click(increase);
    const scale =
      document.documentElement.style.getPropertyValue("--font-scale");
    expect(Number(scale)).toBeGreaterThan(1);
  });

  it("inicia a navegação guiada e exibe o primeiro passo", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(
      screen.getByRole("button", { name: /iniciar navegação guiada/i }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText(/passo 1 de/i)).toBeInTheDocument();
  });
});

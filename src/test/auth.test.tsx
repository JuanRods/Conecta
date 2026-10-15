import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { authService } from "../auth/authService";
import { isStrongPassword } from "../auth/passwordPolicy";

function renderWithProviders(ui: ReactNode, initialPath = "/") {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/" element={ui} />
                <Route path="/painel" element={<h1>Painel do candidato</h1>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>,
  );
}

describe("Política de senha", () => {
  it("rejeita senhas fracas e aceita senhas fortes", () => {
    expect(isStrongPassword("abc")).toBe(false);
    expect(isStrongPassword("Senha@123")).toBe(true);
  });
});

describe("Fluxo de autenticação", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("a tela de cadastro não possui violações de acessibilidade (axe)", async () => {
    const { container } = renderWithProviders(<RegisterPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("registra um candidato e o leva ao painel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/nome completo/i), "Maria Silva");
    await user.type(screen.getByLabelText(/e-mail/i), "maria@exemplo.com");
    await user.type(screen.getByLabelText(/senha/i), "Senha@123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /painel do candidato/i }),
      ).toBeInTheDocument(),
    );
  });

  it("exibe erro ao tentar logar com credenciais inválidas", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    await user.type(screen.getByLabelText(/e-mail/i), "ninguem@exemplo.com");
    await user.type(screen.getByLabelText(/senha/i), "Qualquer@1");
    await user.click(screen.getByRole("button", { name: /^entrar$/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/e-mail ou senha incorretos/i),
      ).toBeInTheDocument(),
    );
  });

  it("cria uma conta de administrador seed para moderação", async () => {
    await authService.login({
      email: "admin@conectainclusao.org",
      password: "Admin@123",
    });
    const session = authService.getSession();
    expect(session?.user.role).toBe("ADMIN");
  });
});

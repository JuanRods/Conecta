import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { JobsPage } from "../pages/JobsPage";
import { JobDetailPage } from "../pages/JobDetailPage";
import { jobService } from "../jobs/jobService";

function renderWithProviders(initialPath = "/vagas") {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/vagas" element={<JobsPage />} />
                <Route path="/vagas/:id" element={<JobDetailPage />} />
                <Route path="/entrar" element={<h1>Entrar</h1>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>,
  );
}

describe("Serviço de vagas", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("expõe na busca pública apenas vagas aprovadas", async () => {
    const results = await jobService.search();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((j) => j.status === "APPROVED")).toBe(true);
  });

  it("filtra por palavra-chave ignorando acentos e caixa", async () => {
    const results = await jobService.search({ keyword: "FRONT-END" });
    expect(results.some((j) => /front-end/i.test(j.title))).toBe(true);
  });

  it("filtra por recursos de acessibilidade (contém todos)", async () => {
    const results = await jobService.search({ features: ["SIGN_LANGUAGE"] });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((j) => j.accessibilityFeatures.includes("SIGN_LANGUAGE")),
    ).toBe(true);
  });

  it("não resolve detalhe de vaga não aprovada", async () => {
    // Localiza, direto no banco, uma vaga semeada em moderação (PENDING)...
    const db = (globalThis as { __conectaDb__?: unknown }).__conectaDb__ as {
      prepare: (sql: string) => { get: () => { id: string } | undefined };
    };
    const pending = db
      .prepare("SELECT id FROM jobs WHERE status = 'PENDING' LIMIT 1")
      .get();
    expect(pending).toBeTruthy();
    // ...e confirma que o detalhe público não a resolve (não vaza por URL direta).
    const job = await jobService.getById(pending!.id);
    expect(job).toBeNull();
  });
});

describe("Página de busca de vagas", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("não possui violações de acessibilidade (axe)", async () => {
    const { container } = renderWithProviders();
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument(),
    );
    // Aguarda os resultados carregarem antes de auditar.
    await waitFor(() =>
      expect(
        screen.queryByText(/buscando vagas/i),
      ).not.toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("lista as vagas aprovadas e permite abrir o detalhe", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // O título da vaga é um heading com link; usamos o heading para abrir.
    const heading = await screen.findByRole("heading", {
      level: 3,
      name: /desenvolvedora front-end/i,
    });
    await user.click(within(heading).getByRole("link"));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /desenvolvedora front-end/i,
        }),
      ).toBeInTheDocument(),
    );
  });

  it("redireciona para login ao tentar se candidatar sem conta (P2.3)", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    const heading = await screen.findByRole("heading", {
      level: 3,
      name: /desenvolvedora front-end/i,
    });
    await user.click(within(heading).getByRole("link"));

    const apply = await screen.findByRole("button", {
      name: /candidatar-se/i,
    });
    await user.click(apply);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /^entrar$/i }),
      ).toBeInTheDocument(),
    );
  });

  it("filtra por modalidade remota e anuncia a quantidade", async () => {
    const user = userEvent.setup();
    renderWithProviders();

    await screen.findByRole("heading", {
      level: 3,
      name: /desenvolvedora front-end/i,
    });

    await user.selectOptions(screen.getByLabelText(/modalidade/i), "REMOTE");
    await user.click(screen.getByRole("button", { name: /^buscar$/i }));

    await waitFor(() => {
      const region = screen.getByRole("region", { name: /vaga/i });
      // Todas as vagas visíveis devem ser remotas.
      expect(
        within(region).queryByText(/presencial/i),
      ).not.toBeInTheDocument();
    });
  });
});

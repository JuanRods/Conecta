import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { authService } from "../auth/authService";
import { profileService } from "../candidate/profileService";
import { applicationService } from "../candidate/applicationService";
import { reportService } from "../candidate/reportService";
import { ProfilePage } from "../pages/candidate/ProfilePage";
import { ApplicationsPage } from "../pages/candidate/ApplicationsPage";

function renderWithProviders(ui: ReactNode, initialPath = "/") {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/" element={ui} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>,
  );
}

let candidateSeq = 0;

/**
 * Cria e autentica um candidato, retornando o id de usuário. A sessão (token)
 * fica ativa no cliente HTTP, de modo que os serviços operam como o candidato
 * autenticado — refletindo o comportamento real do backend (RBAC).
 */
async function seedCandidate(
  email = "ana@exemplo.com",
): Promise<string> {
  const session = await authService.register({
    name: "Ana Souza",
    email,
    password: "Senha@123",
    accountType: "candidate",
  });
  return session.user.id;
}

describe("Serviço de perfil do candidato", () => {
  beforeEach(() => localStorage.clear());

  it("salva e lê o perfil, mantendo as acomodações sensíveis", async () => {
    const userId = await seedCandidate(`perfil-${candidateSeq++}@exemplo.com`);
    await profileService.save({
      userId,
      headline: "Desenvolvedora",
      bio: "",
      skills: ["React"],
      experience: "",
      education: "",
      visibility: "PRIVATE",
      sensitive: {
        disabilityType: "VISUAL",
        accommodations: ["SCREEN_READER"],
      },
      updatedAt: new Date().toISOString(),
    });

    const loaded = await profileService.get(userId);
    expect(loaded.headline).toBe("Desenvolvedora");
    expect(loaded.visibility).toBe("PRIVATE");
    expect(loaded.sensitive.disabilityType).toBe("VISUAL");
    expect(loaded.sensitive.accommodations).toContain("SCREEN_READER");
  });

  it("não guarda o bloco sensível em texto puro (criptografado em repouso)", async () => {
    const userId = await seedCandidate(`cripto-${candidateSeq++}@exemplo.com`);
    await profileService.save({
      userId,
      headline: "Analista",
      bio: "",
      skills: [],
      experience: "",
      education: "",
      visibility: "PUBLIC",
      sensitive: {
        disabilityType: "HEARING",
        accommodations: ["SIGN_LANGUAGE"],
      },
      updatedAt: new Date().toISOString(),
    });
    // Verifica diretamente no SQLite: o bloco sensível é cifrado (AES-256-GCM),
    // nunca gravado em texto puro (NF2 / LGPD).
    const db = (globalThis as { __conectaDb__?: unknown }).__conectaDb__ as {
      prepare: (sql: string) => { get: (id: string) => { sensitive_enc: string } };
    };
    const row = db
      .prepare("SELECT sensitive_enc FROM candidate_profiles WHERE user_id = ?")
      .get(userId);
    expect(row.sensitive_enc).toMatch(/^gcm:/);
    expect(row.sensitive_enc).not.toContain("HEARING");
    expect(row.sensitive_enc).not.toContain("SIGN_LANGUAGE");
  });
});

describe("Serviço de candidaturas e favoritos", () => {
  beforeEach(() => localStorage.clear());

  const job = { id: "job-1", title: "Dev Front-end", companyName: "TechInclui" };

  it("registra candidatura e impede duplicidade", async () => {
    const id = await seedCandidate(`app1-${candidateSeq++}@exemplo.com`);
    await applicationService.apply(id, job, ["SCREEN_READER"]);
    const apps = await applicationService.listByCandidate(id);
    expect(apps).toHaveLength(1);
    expect(apps[0].status).toBe("SENT");
    expect(apps[0].sharedAccommodations).toContain("SCREEN_READER");

    await expect(applicationService.apply(id, job)).rejects.toThrow(
      /já se candidatou/i,
    );
  });

  it("só grava acomodações quando há consentimento", async () => {
    const id = await seedCandidate(`app2-${candidateSeq++}@exemplo.com`);
    await applicationService.apply(id, job); // sem compartilhar
    const [app] = await applicationService.listByCandidate(id);
    expect(app.sharedAccommodations).toBeUndefined();
  });

  it("alterna favoritos e isola por candidato", async () => {
    const emailA = `fav-a-${candidateSeq++}@exemplo.com`;
    const a = await seedCandidate(emailA);
    expect(await applicationService.toggleFavorite(a, job)).toBe(true);
    expect(await applicationService.isFavorite(a, job.id)).toBe(true);

    // Outro candidato (nova sessão) não vê o favorito do primeiro.
    const b = await seedCandidate(`fav-b-${candidateSeq++}@exemplo.com`);
    expect(await applicationService.isFavorite(b, job.id)).toBe(false);

    // Volta à sessão do primeiro candidato para alternar de volta.
    await authService.login({ email: emailA, password: "Senha@123" });
    expect(await applicationService.toggleFavorite(a, job)).toBe(false);
  });
});

describe("Serviço de denúncias", () => {
  beforeEach(() => localStorage.clear());

  it("envia a denúncia à fila de moderação como PENDING", async () => {
    const reporterId = await seedCandidate(`den-${candidateSeq++}@exemplo.com`);
    await reportService.submit({
      targetType: "JOB",
      targetId: "job-9",
      targetLabel: "Vaga suspeita",
      reporterId,
      reason: "DISCRIMINATION",
    });
    // A fila de moderação é lida por um ADMIN.
    await authService.login({
      email: "admin@conectainclusao.org",
      password: "Admin@123",
    });
    const pending = await reportService.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe("PENDING");
    expect(pending[0].reason).toBe("DISCRIMINATION");
  });
});

describe("Página de perfil do candidato", () => {
  beforeEach(() => localStorage.clear());

  it("não possui violações de acessibilidade (axe)", async () => {
    await seedCandidate();
    const { container } = renderWithProviders(<ProfilePage />);
    await screen.findByRole("heading", { name: /meu perfil/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("salva os dados profissionais informados", async () => {
    const user = userEvent.setup();
    const userId = await seedCandidate();
    renderWithProviders(<ProfilePage />);

    await screen.findByRole("heading", { name: /meu perfil/i });
    await user.type(
      screen.getByLabelText(/título profissional/i),
      "Pessoa Desenvolvedora",
    );
    await user.click(screen.getByRole("button", { name: /salvar perfil/i }));

    await waitFor(async () => {
      const saved = await profileService.get(userId);
      expect(saved.headline).toBe("Pessoa Desenvolvedora");
    });
  });
});

describe("Painel de candidaturas", () => {
  beforeEach(() => localStorage.clear());

  it("mostra as candidaturas com status acessível", async () => {
    const userId = await seedCandidate();
    await applicationService.apply(userId, {
      id: "job-5",
      title: "Analista de Dados",
      companyName: "LogAccess",
    });

    renderWithProviders(<ApplicationsPage />);

    const heading = await screen.findByRole("heading", {
      name: /analista de dados/i,
    });
    const card = heading.closest("article") as HTMLElement;
    // A linha "Status atual" deve refletir o estado inicial da candidatura.
    expect(
      within(card).getByText(/status atual:/i).textContent,
    ).toMatch(/enviada/i);
  });
});

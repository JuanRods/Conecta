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
import { authService } from "../auth/authService";
import { profileService } from "../candidate/profileService";
import { applicationService } from "../candidate/applicationService";
import { privacyService, CONSENT_VERSION } from "../privacy/privacyService";
import { PrivacyPage } from "../pages/candidate/PrivacyPage";

function renderWithProviders(ui: ReactNode) {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter>
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

async function seedCandidateWithData() {
  const session = await authService.register({
    name: "Ana Privacy",
    email: "ana.privacy@exemplo.com",
    password: "Senha@123",
    accountType: "candidate",
  });
  const userId = session.user.id;
  await profileService.save({
    userId,
    headline: "Dev",
    bio: "",
    skills: [],
    experience: "",
    education: "",
    visibility: "PRIVATE",
    sensitive: { disabilityType: "VISUAL", accommodations: ["SCREEN_READER"] },
    updatedAt: new Date().toISOString(),
  });
  await applicationService.apply(userId, {
    id: "job-1",
    title: "Dev Front-end",
    companyName: "TechInclui",
  });
  return session.user;
}

describe("Serviço de privacidade (LGPD/NF2)", () => {
  beforeEach(() => localStorage.clear());

  it("registra e revoga consentimento versionado", async () => {
    const session = await authService.register({
      name: "Consent User",
      email: "consent@exemplo.com",
      password: "Senha@123",
      accountType: "candidate",
    });
    const uid = session.user.id;

    await privacyService.recordConsent(uid);
    expect(privacyService.hasConsented(uid)).toBe(true);
    expect(privacyService.getConsent(uid)?.version).toBe(CONSENT_VERSION);

    await privacyService.revokeConsent(uid);
    expect(privacyService.hasConsented(uid)).toBe(false);
  });

  it("exporta todos os dados do candidato (portabilidade)", async () => {
    const user = await seedCandidateWithData();
    const data = await privacyService.exportCandidateData(user);
    expect(data.account.id).toBe(user.id);
    expect(Array.isArray(data.applications)).toBe(true);
    expect((data.applications as unknown[]).length).toBe(1);
    expect(data.profile).toBeTruthy();
  });

  it("exclui a conta e todos os dados associados (direito à exclusão)", async () => {
    const user = await seedCandidateWithData();
    await privacyService.deleteCandidateAccount(user.id);
    // A exclusão encerra a sessão; o consentimento em cache local é limpo.
    expect(privacyService.hasConsented(user.id)).toBe(false);

    // Verifica, como ADMIN, que a conta e seus dados sumiram do banco.
    await authService.login({
      email: "admin@conectainclusao.org",
      password: "Admin@123",
    });
    const users = await authService.listUsers();
    expect(users.find((u) => u.id === user.id)).toBeUndefined();

    const db = (globalThis as { __conectaDb__?: unknown }).__conectaDb__ as {
      prepare: (sql: string) => { get: (id: string) => { n: number } };
    };
    const apps = db
      .prepare("SELECT COUNT(*) n FROM applications WHERE candidate_id = ?")
      .get(user.id);
    expect(apps.n).toBe(0);
  });
});

describe("Central de Privacidade (página)", () => {
  beforeEach(() => localStorage.clear());

  it("não possui violações de acessibilidade (axe)", async () => {
    await authService.register({
      name: "Ana",
      email: "ana@exemplo.com",
      password: "Senha@123",
      accountType: "candidate",
    });
    const { container } = renderWithProviders(<PrivacyPage />);
    await screen.findByRole("heading", { name: /privacidade e meus dados/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("permite dar consentimento pela interface", async () => {
    const user = userEvent.setup();
    const session = await authService.register({
      name: "Bruno",
      email: "bruno@exemplo.com",
      password: "Senha@123",
      accountType: "candidate",
    });
    renderWithProviders(<PrivacyPage />);

    await screen.findByRole("heading", { name: /privacidade e meus dados/i });
    await user.click(screen.getByRole("button", { name: /dar consentimento/i }));

    await waitFor(() =>
      expect(privacyService.hasConsented(session.user.id)).toBe(true),
    );
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { PreferencesProvider } from "../accessibility/PreferencesContext";
import { AnnouncerProvider } from "../accessibility/Announcer";
import { GuidedTourProvider } from "../accessibility/GuidedTour";
import { AuthProvider } from "../auth/AuthContext";
import { authService } from "../auth/authService";
import { AuthError } from "../auth/types";
import { jobService } from "../jobs/jobService";
import { companyService } from "../company/companyService";
import { reportService } from "../candidate/reportService";
import { moderationService } from "../admin/moderationService";
import { metricsService } from "../admin/metricsService";
import { ModerationQueuePage } from "../pages/admin/ModerationQueuePage";

const ADMIN = { id: "admin-1", name: "Admin Teste" };

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

async function createPendingJob() {
  return jobService.create({
    companyId: "c-1",
    companyName: "TechInclui",
    title: "Dev Acessível",
    description: "Vaga para pessoa com deficiência.",
    location: "Remoto",
    modality: "REMOTE",
    level: "MID",
    area: "Tecnologia",
    accessibilityFeatures: ["SCREEN_READER"],
  });
}

describe("Moderação de vagas (M1)", () => {
  beforeEach(() => localStorage.clear());

  it("aprovar torna a vaga pública e registra auditoria + notificação", async () => {
    const job = await createPendingJob();
    await moderationService.approveJob(ADMIN, job.id);

    const publicResults = await jobService.search({ keyword: "Acessível" });
    expect(publicResults.find((j) => j.id === job.id)).toBeDefined();

    const audit = await moderationService.listAudit();
    expect(audit.some((a) => a.action === "APPROVE")).toBe(true);
  });

  it("rejeitar com motivo registra auditoria e não publica", async () => {
    const job = await createPendingJob();
    await moderationService.rejectJob(ADMIN, job.id, "Linguagem inadequada.");

    const publicResults = await jobService.search({ keyword: "Acessível" });
    expect(publicResults.find((j) => j.id === job.id)).toBeUndefined();

    const audit = await moderationService.listAudit();
    const entry = audit.find((a) => a.action === "REJECT");
    expect(entry?.reason).toMatch(/inadequada/i);
  });
});

describe("Verificação de empresa (M1)", () => {
  beforeEach(() => localStorage.clear());

  it("verifica a empresa e some da fila", async () => {
    await companyService.save({
      userId: "c-9",
      name: "LogAccess",
      cnpj: "11.222.333/0001-81",
      sector: "Logística",
      description: "",
      inclusionPolicy: "",
      accessibilityFeatures: [],
      verificationStatus: "PENDING",
      updatedAt: new Date().toISOString(),
    });
    await moderationService.verifyCompany(ADMIN, "c-9");

    const pending = await companyService.listPendingVerification();
    expect(pending.find((c) => c.userId === "c-9")).toBeUndefined();
    const company = await companyService.get("c-9");
    expect(company.verificationStatus).toBe("VERIFIED");
  });
});

describe("Denúncias (M2)", () => {
  beforeEach(() => localStorage.clear());

  it("arquiva uma denúncia pendente", async () => {
    const report = await reportService.submit({
      targetType: "JOB",
      targetId: "job-1",
      targetLabel: "Vaga X",
      reporterId: "cand-1",
      reason: "SPAM",
    });
    await moderationService.archiveReport(ADMIN, report.id, "Vaga X");
    const pending = await reportService.listPending();
    expect(pending).toHaveLength(0);
  });
});

describe("Contas (M2.5)", () => {
  beforeEach(() => localStorage.clear());

  it("suspende conta e bloqueia o login; reativa e libera", async () => {
    const session = await authService.register({
      name: "Carlos",
      email: "carlos@exemplo.com",
      password: "Senha@123",
      accountType: "candidate",
    });
    authService.logout();

    await moderationService.suspendUser(
      ADMIN,
      session.user.id,
      "Carlos",
      "Comportamento abusivo.",
    );

    await expect(
      authService.login({ email: "carlos@exemplo.com", password: "Senha@123" }),
    ).rejects.toBeInstanceOf(AuthError);

    await moderationService.reactivateUser(ADMIN, session.user.id, "Carlos");
    const ok = await authService.login({
      email: "carlos@exemplo.com",
      password: "Senha@123",
    });
    expect(ok.user.status).toBe("ACTIVE");
  });
});

describe("Métricas (M3)", () => {
  beforeEach(() => localStorage.clear());

  it("gera CSV com cabeçalho e totais", async () => {
    const metrics = await metricsService.get();
    const csv = metricsService.toCsv(metrics);
    expect(csv.split("\r\n")[0]).toBe('"Métrica",Valor');
    expect(csv).toMatch(/Usuários \(total\)/);
  });
});

describe("Página de moderação", () => {
  beforeEach(() => localStorage.clear());

  it("não possui violações de acessibilidade (axe)", async () => {
    await createPendingJob();
    const { container } = renderWithProviders(<ModerationQueuePage />);
    await screen.findByRole("heading", {
      name: /vagas aguardando moderação/i,
    });
    await waitFor(() =>
      expect(
        screen.queryByText(/carregando fila/i),
      ).not.toBeInTheDocument(),
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

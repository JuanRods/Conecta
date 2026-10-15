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

let seq = 0;

/** Autentica como o administrador semeado. */
async function asAdmin() {
  await authService.login({
    email: "admin@conectainclusao.org",
    password: "Admin@123",
  });
}

/** Cria e autentica uma empresa, retornando o id. */
async function asCompany(email: string): Promise<string> {
  const s = await authService.register({
    name: "Empresa",
    email,
    password: "Senha@123",
    accountType: "company",
  });
  return s.user.id;
}

/** Cria uma vaga PENDING como empresa autenticada e retorna a vaga. */
async function createPendingJobAsCompany(email: string) {
  await asCompany(email);
  return jobService.create({
    companyId: "ignored",
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

describe("Moderação de vagas (M1)", () => {
  beforeEach(() => localStorage.clear());

  it("aprovar torna a vaga pública e registra auditoria + notificação", async () => {
    const job = await createPendingJobAsCompany(`mod-${seq++}@empresa.com`);
    await asAdmin();
    await moderationService.approveJob(ADMIN, job.id);

    const publicResults = await jobService.search({ keyword: "Acessível" });
    expect(publicResults.find((j) => j.id === job.id)).toBeDefined();

    const audit = await moderationService.listAudit();
    expect(audit.some((a) => a.action === "APPROVE")).toBe(true);
  });

  it("rejeitar com motivo registra auditoria e não publica", async () => {
    const job = await createPendingJobAsCompany(`mod-${seq++}@empresa.com`);
    await asAdmin();
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
    const companyId = await asCompany(`ver-${seq++}@empresa.com`);
    await companyService.save({
      userId: companyId,
      name: "LogAccess",
      cnpj: "11.222.333/0001-81",
      sector: "Logística",
      description: "",
      inclusionPolicy: "",
      accessibilityFeatures: [],
      verificationStatus: "PENDING",
      updatedAt: new Date().toISOString(),
    });
    await asAdmin();
    await moderationService.verifyCompany(ADMIN, companyId);

    const pending = await companyService.listPendingVerification();
    expect(pending.find((c) => c.userId === companyId)).toBeUndefined();
    const company = await companyService.setVerification(companyId, "VERIFIED");
    expect(company.verificationStatus).toBe("VERIFIED");
  });
});

describe("Denúncias (M2)", () => {
  beforeEach(() => localStorage.clear());

  it("arquiva uma denúncia pendente", async () => {
    const reporterId = await (async () => {
      const s = await authService.register({
        name: "Denunciante",
        email: `rep-${seq++}@exemplo.com`,
        password: "Senha@123",
        accountType: "candidate",
      });
      return s.user.id;
    })();
    const report = await reportService.submit({
      targetType: "JOB",
      targetId: "job-1",
      targetLabel: "Vaga X",
      reporterId,
      reason: "SPAM",
    });
    await asAdmin();
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

    await asAdmin();
    await moderationService.suspendUser(
      ADMIN,
      session.user.id,
      "Carlos",
      "Comportamento abusivo.",
    );

    await expect(
      authService.login({ email: "carlos@exemplo.com", password: "Senha@123" }),
    ).rejects.toBeInstanceOf(AuthError);

    await asAdmin();
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
    await asAdmin();
    const metrics = await metricsService.get();
    const csv = metricsService.toCsv(metrics);
    expect(csv.split("\r\n")[0]).toBe('"Métrica",Valor');
    expect(csv).toMatch(/Usuários \(total\)/);
  });
});

describe("Página de moderação", () => {
  beforeEach(() => localStorage.clear());

  it("não possui violações de acessibilidade (axe)", async () => {
    await createPendingJobAsCompany(`modpage-${seq++}@empresa.com`);
    await asAdmin();
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

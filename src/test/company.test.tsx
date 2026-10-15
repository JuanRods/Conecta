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
import {
  companyService,
  isValidCnpj,
  formatCnpj,
} from "../company/companyService";
import { analyzeDescription } from "../company/inclusiveLanguage";
import { jobService } from "../jobs/jobService";
import { applicationService } from "../candidate/applicationService";
import { CompanyProfilePage } from "../pages/company/CompanyProfilePage";
import { JobFormPage } from "../pages/company/JobFormPage";

function renderWithProviders(ui: ReactNode, initialPath = "/") {
  return render(
    <PreferencesProvider>
      <AnnouncerProvider>
        <GuidedTourProvider>
          <AuthProvider>
            <MemoryRouter initialEntries={[initialPath]}>
              <Routes>
                <Route path="/" element={ui} />
                <Route path="/empresa/vagas" element={<h1>Minhas vagas</h1>} />
              </Routes>
            </MemoryRouter>
          </AuthProvider>
        </GuidedTourProvider>
      </AnnouncerProvider>
    </PreferencesProvider>,
  );
}

async function seedCompany(): Promise<string> {
  const session = await authService.register({
    name: "Recrutador",
    email: "rh@empresa.com",
    password: "Senha@123",
    accountType: "company",
  });
  return session.user.id;
}

describe("CNPJ", () => {
  it("valida 14 dígitos e formata", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("123")).toBe(false);
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });
});

describe("Serviço de perfil da empresa", () => {
  beforeEach(() => localStorage.clear());

  it("cadastra empresa como pendente de verificação (E1.3)", async () => {
    const saved = await companyService.save({
      userId: "c-1",
      name: "TechInclui",
      cnpj: "11.222.333/0001-81",
      sector: "Tecnologia",
      description: "",
      inclusionPolicy: "",
      accessibilityFeatures: ["SCREEN_READER"],
      verificationStatus: "PENDING",
      updatedAt: new Date().toISOString(),
    });
    expect(saved.verificationStatus).toBe("PENDING");
    expect(await companyService.exists("c-1")).toBe(true);
  });
});

describe("CRUD de vagas da empresa", () => {
  beforeEach(() => localStorage.clear());

  const base = {
    companyId: "c-9",
    companyName: "TechInclui",
    title: "Dev Back-end",
    description: "Vaga para pessoa desenvolvedora.",
    location: "Remoto",
    modality: "REMOTE" as const,
    level: "MID" as const,
    area: "Tecnologia",
    accessibilityFeatures: ["SCREEN_READER" as const],
  };

  it("cria vaga em PENDING e não aparece na busca pública (E2.3/M1)", async () => {
    const created = await jobService.create(base);
    expect(created.status).toBe("PENDING");

    const owned = await jobService.listByCompany("c-9");
    expect(owned).toHaveLength(1);

    const publicResults = await jobService.search({ keyword: "Back-end" });
    expect(publicResults.find((j) => j.id === created.id)).toBeUndefined();
  });

  it("edição de vaga aprovada volta para a moderação", async () => {
    const created = await jobService.create(base);
    // Simula aprovação pela moderação.
    await jobService.setStatus("c-9", created.id, "APPROVED");
    const edited = await jobService.update("c-9", created.id, {
      title: "Dev Back-end Sênior",
    });
    expect(edited.status).toBe("PENDING");
    expect(edited.publishedAt).toBeUndefined();
  });

  it("pausar, encerrar e duplicar vaga", async () => {
    const created = await jobService.create(base);
    const paused = await jobService.setStatus("c-9", created.id, "PAUSED");
    expect(paused.status).toBe("PAUSED");

    const dup = await jobService.duplicate("c-9", created.id);
    expect(dup.status).toBe("DRAFT");
    expect(dup.title).toMatch(/cópia/i);

    const all = await jobService.listByCompany("c-9");
    expect(all).toHaveLength(2);
  });
});

describe("Assistente de linguagem inclusiva (E2.2)", () => {
  it("sinaliza termos capacitistas e aprova texto adequado", () => {
    const bad = analyzeDescription(
      "Buscamos portador de deficiência para a vaga.",
    );
    expect(bad.length).toBeGreaterThan(0);

    const good = analyzeDescription(
      "Buscamos pessoa com deficiência (PcD) para a vaga.",
    );
    expect(good).toHaveLength(0);
  });
});

describe("Gestão de candidaturas (E3)", () => {
  beforeEach(() => localStorage.clear());

  it("atualiza status e notifica o candidato", async () => {
    const app = await applicationService.apply("cand-1", {
      id: "job-1",
      title: "Dev Front-end",
      companyName: "TechInclui",
    });
    await applicationService.updateStatus(app.id, "INTERVIEW");

    const byJob = await applicationService.listByJob("job-1");
    expect(byJob[0].status).toBe("INTERVIEW");

    const notes = await applicationService.listNotifications("cand-1");
    expect(notes).toHaveLength(1);
    expect(notes[0].status).toBe("INTERVIEW");
  });

  it("não expõe acomodações sem consentimento (E3.3/NF2)", async () => {
    await applicationService.apply("cand-2", {
      id: "job-2",
      title: "Analista",
      companyName: "LogAccess",
    }); // sem compartilhar
    const [app] = await applicationService.listByJob("job-2");
    expect(app.sharedAccommodations).toBeUndefined();
  });
});

describe("Páginas da empresa", () => {
  beforeEach(() => localStorage.clear());

  it("perfil da empresa não possui violações de acessibilidade (axe)", async () => {
    await seedCompany();
    const { container } = renderWithProviders(<CompanyProfilePage />);
    await screen.findByRole("heading", { name: /perfil da empresa/i });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("cria uma vaga pelo formulário e envia à moderação", async () => {
    const user = userEvent.setup();
    const userId = await seedCompany();
    renderWithProviders(<JobFormPage />, "/");

    await screen.findByRole("heading", { name: /nova vaga/i });
    await user.type(screen.getByLabelText(/^título/i), "Pessoa Desenvolvedora");
    await user.type(
      screen.getByLabelText(/^descrição/i),
      "Vaga inclusiva para pessoa com deficiência.",
    );
    await user.type(screen.getByLabelText(/^área/i), "Tecnologia");
    await user.click(
      screen.getByRole("button", { name: /criar e enviar à moderação/i }),
    );

    await waitFor(async () => {
      const jobs = await jobService.listByCompany(userId);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].status).toBe("PENDING");
    });
  });
});

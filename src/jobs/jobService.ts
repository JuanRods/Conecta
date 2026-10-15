import type {
  AccessibilityFeature,
  Job,
  JobFilters,
  JobStatus,
} from "./types";

/**
 * Serviço de vagas (Fase 3).
 *
 * NOTA DE AMBIENTE: o sandbox está em modo INTEGRATIONS_ONLY (sem backend),
 * então esta é uma implementação MOCK que persiste em localStorage e simula
 * os endpoints do design (GET /jobs, GET /jobs/:id). A busca pública expõe
 * apenas vagas com status APPROVED (P2.2 / M1), espelhando a regra que o
 * backend real aplicaria para visitantes (GUEST). A interface pública foi
 * desenhada para ser trocada por um cliente HTTP real sem mudar os consumidores.
 */

const JOBS_KEY = "conecta.jobs";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `job-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

function normalize(text: string): string {
  // Remove acentos e caixa para busca tolerante.
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// --- Seed: catálogo inicial de vagas para a busca pública ter conteúdo ---

const SEED_JOBS: Omit<Job, "id">[] = [
  {
    companyId: "seed-techinclui",
    companyName: "TechInclui",
    title: "Pessoa Desenvolvedora Front-end",
    description:
      "Atuação em produtos web acessíveis (WCAG 2.1 AA) com React e TypeScript. " +
      "Você trabalhará com uma equipe que prioriza acessibilidade desde o design, " +
      "com revisões de código focadas em semântica e navegação por teclado.",
    location: "São Paulo, SP",
    modality: "REMOTE",
    level: "MID",
    area: "Tecnologia",
    accessibilityFeatures: [
      "SCREEN_READER",
      "FLEXIBLE_HOURS",
      "ASSISTIVE_TECH",
      "INCLUSIVE_ONBOARDING",
    ],
    status: "APPROVED",
    createdAt: "2026-09-20T12:00:00.000Z",
    publishedAt: "2026-09-21T12:00:00.000Z",
  },
  {
    companyId: "seed-cuidarbem",
    companyName: "CuidarBem Saúde",
    title: "Analista de Atendimento (Libras)",
    description:
      "Atendimento humanizado a clientes, com suporte em Libras. Oferecemos " +
      "intérprete, materiais acessíveis e integração inclusiva para novos membros.",
    location: "Belo Horizonte, MG",
    modality: "HYBRID",
    level: "JUNIOR",
    area: "Atendimento",
    accessibilityFeatures: [
      "SIGN_LANGUAGE",
      "INCLUSIVE_ONBOARDING",
      "FLEXIBLE_HOURS",
    ],
    status: "APPROVED",
    createdAt: "2026-09-25T12:00:00.000Z",
    publishedAt: "2026-09-26T12:00:00.000Z",
  },
  {
    companyId: "seed-logaccess",
    companyName: "LogAccess",
    title: "Pessoa Analista Financeira Sênior",
    description:
      "Planejamento e análise financeira em ambiente totalmente acessível, com " +
      "acesso físico para cadeirantes e estações de trabalho adaptadas.",
    location: "Rio de Janeiro, RJ",
    modality: "ONSITE",
    level: "SENIOR",
    area: "Financeiro",
    accessibilityFeatures: [
      "WHEELCHAIR_ACCESS",
      "ASSISTIVE_TECH",
      "INCLUSIVE_ONBOARDING",
    ],
    status: "APPROVED",
    createdAt: "2026-10-01T12:00:00.000Z",
    publishedAt: "2026-10-02T12:00:00.000Z",
  },
  {
    companyId: "seed-techinclui",
    companyName: "TechInclui",
    title: "Pessoa Designer de Produto (UX) Acessível",
    description:
      "Projetos de experiência com foco em inclusão: pesquisa com pessoas com " +
      "deficiência, protótipos testáveis por leitor de tela e horário flexível.",
    location: "Remoto (Brasil)",
    modality: "REMOTE",
    level: "SENIOR",
    area: "Design",
    accessibilityFeatures: [
      "SCREEN_READER",
      "FLEXIBLE_HOURS",
      "ASSISTIVE_TECH",
    ],
    status: "APPROVED",
    createdAt: "2026-10-05T12:00:00.000Z",
    publishedAt: "2026-10-06T12:00:00.000Z",
  },
  {
    companyId: "seed-edulivre",
    companyName: "EduLivre",
    title: "Pessoa Educadora de Conteúdo",
    description:
      "Produção de material didático acessível para plataforma de ensino. " +
      "Esta vaga ainda está em moderação e NÃO deve aparecer na busca pública.",
    location: "Curitiba, PR",
    modality: "HYBRID",
    level: "MID",
    area: "Educação",
    accessibilityFeatures: ["SCREEN_READER", "INCLUSIVE_ONBOARDING"],
    // Intencionalmente PENDING: valida que a busca pública só mostra APPROVED.
    status: "PENDING",
    createdAt: "2026-10-10T12:00:00.000Z",
  },
];

function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_KEY);
    if (raw) return JSON.parse(raw) as Job[];
  } catch {
    /* cai no seed abaixo */
  }
  const seeded = SEED_JOBS.map((j) => ({ ...j, id: makeId() }));
  localStorage.setItem(JOBS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveJobs(jobs: Job[]) {
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
}

function matchesFilters(job: Job, filters: JobFilters): boolean {
  const { keyword, location, modality, level, area, features } = filters;

  if (keyword) {
    const q = normalize(keyword);
    const haystack = normalize(
      `${job.title} ${job.description} ${job.companyName} ${job.area}`,
    );
    if (!haystack.includes(q)) return false;
  }

  if (location) {
    if (!normalize(job.location).includes(normalize(location))) return false;
  }

  if (modality && job.modality !== modality) return false;
  if (level && job.level !== level) return false;
  if (area && normalize(job.area) !== normalize(area)) return false;

  if (features && features.length > 0) {
    const owned = new Set(job.accessibilityFeatures);
    if (!features.every((f) => owned.has(f))) return false;
  }

  return true;
}

export const jobService = {
  /**
   * Busca pública: retorna apenas vagas APPROVED que atendem aos filtros,
   * ordenadas da mais recente para a mais antiga (por publishedAt/createdAt).
   */
  async search(filters: JobFilters = {}): Promise<Job[]> {
    const results = loadJobs()
      .filter((j) => j.status === "APPROVED")
      .filter((j) => matchesFilters(j, filters))
      .sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(
          a.publishedAt ?? a.createdAt,
        ),
      );
    return simulateLatency(results);
  },

  /**
   * Detalhe de uma vaga para o público: só resolve se estiver APPROVED,
   * evitando vazamento de vagas em moderação por URL direta.
   */
  async getById(id: string): Promise<Job | null> {
    const job = loadJobs().find((j) => j.id === id && j.status === "APPROVED");
    return simulateLatency(job ?? null);
  },

  /** Áreas distintas das vagas aprovadas — alimenta o filtro de área. */
  async listAreas(): Promise<string[]> {
    const areas = new Set(
      loadJobs()
        .filter((j) => j.status === "APPROVED")
        .map((j) => j.area),
    );
    return simulateLatency([...areas].sort((a, b) => a.localeCompare(b)));
  },

  // ---------------------------------------------------------------------------
  // Operações da EMPRESA (Fase 5) e da MODERAÇÃO (Fase 6) sobre o mesmo acervo.
  // ---------------------------------------------------------------------------

  /** Lista todas as vagas de uma empresa (qualquer status), mais recentes antes. */
  async listByCompany(companyId: string): Promise<Job[]> {
    const jobs = loadJobs()
      .filter((j) => j.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return simulateLatency(jobs);
  },

  /** Detalhe para a empresa dona da vaga — independe do status. */
  async getOwnedById(companyId: string, id: string): Promise<Job | null> {
    const job = loadJobs().find(
      (j) => j.id === id && j.companyId === companyId,
    );
    return simulateLatency(job ?? null);
  },

  /**
   * Cria uma vaga já encaminhada à moderação (status PENDING) — E2.3 / M1.
   * `createdAt` é definido aqui; `publishedAt` só é preenchido na aprovação.
   */
  async create(
    input: Omit<Job, "id" | "status" | "createdAt" | "publishedAt">,
  ): Promise<Job> {
    const all = loadJobs();
    const job: Job = {
      ...input,
      id: makeId(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    all.push(job);
    saveJobs(all);
    return simulateLatency(job);
  },

  /**
   * Edita uma vaga da empresa. Edições em vagas já publicadas/rejeitadas voltam
   * para a moderação (PENDING), pois o conteúdo mudou (M1).
   */
  async update(
    companyId: string,
    id: string,
    patch: Partial<Omit<Job, "id" | "companyId" | "status" | "createdAt">>,
  ): Promise<Job> {
    const all = loadJobs();
    const idx = all.findIndex((j) => j.id === id && j.companyId === companyId);
    if (idx === -1) throw new Error("Vaga não encontrada.");
    const current = all[idx];
    const resetToModeration =
      current.status === "APPROVED" || current.status === "REJECTED";
    const updated: Job = {
      ...current,
      ...patch,
      status: resetToModeration ? "PENDING" : current.status,
      publishedAt: resetToModeration ? undefined : current.publishedAt,
    };
    all[idx] = updated;
    saveJobs(all);
    return simulateLatency(updated);
  },

  /** Altera o status de uma vaga da empresa (pausar, encerrar, reabrir). */
  async setStatus(
    companyId: string,
    id: string,
    status: JobStatus,
  ): Promise<Job> {
    const all = loadJobs();
    const idx = all.findIndex((j) => j.id === id && j.companyId === companyId);
    if (idx === -1) throw new Error("Vaga não encontrada.");
    all[idx] = { ...all[idx], status };
    saveJobs(all);
    return simulateLatency(all[idx]);
  },

  /** Duplica uma vaga como novo rascunho (DRAFT) — E2.4. */
  async duplicate(companyId: string, id: string): Promise<Job> {
    const all = loadJobs();
    const source = all.find((j) => j.id === id && j.companyId === companyId);
    if (!source) throw new Error("Vaga não encontrada.");
    const copy: Job = {
      ...source,
      id: makeId(),
      title: `${source.title} (cópia)`,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      publishedAt: undefined,
    };
    all.push(copy);
    saveJobs(all);
    return simulateLatency(copy);
  },

  /** Envia um rascunho (ou vaga pausada) à moderação. */
  async submitForReview(companyId: string, id: string): Promise<Job> {
    return this.setStatus(companyId, id, "PENDING");
  },

  /** Remove uma vaga da empresa. */
  async remove(companyId: string, id: string): Promise<void> {
    const all = loadJobs().filter(
      (j) => !(j.id === id && j.companyId === companyId),
    );
    saveJobs(all);
    await simulateLatency(null);
  },
};

export type { AccessibilityFeature };

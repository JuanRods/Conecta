import type { AccessibilityFeature, Job } from "../jobs/types";
import type { Application, Favorite, JobAlert } from "./types";

/**
 * Serviço de candidaturas, favoritos e alertas (Fase 4 — C2).
 *
 * NOTA DE AMBIENTE: MOCK em localStorage (sandbox sem backend). A interface
 * espelha os endpoints do design (POST /applications, GET /applications/me).
 *
 * NF2 / LGPD: as acomodações (dado sensível) só são anexadas à candidatura
 * quando o candidato dá consentimento explícito (`sharedAccommodations`).
 */

const APPLICATIONS_KEY = "conecta.candidate.applications";
const FAVORITES_KEY = "conecta.candidate.favorites";
const ALERTS_KEY = "conecta.candidate.alerts";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `app-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as T[];
  } catch {
    return [];
  }
}

function save<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export class ApplicationError extends Error {
  constructor(
    public code: "ALREADY_APPLIED",
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export const applicationService = {
  // --- Candidaturas (C2.2, C2.3) ---

  async listByCandidate(candidateId: string): Promise<Application[]> {
    const apps = load<Application>(APPLICATIONS_KEY)
      .filter((a) => a.candidateId === candidateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return simulateLatency(apps);
  },

  async hasApplied(candidateId: string, jobId: string): Promise<boolean> {
    const applied = load<Application>(APPLICATIONS_KEY).some(
      (a) => a.candidateId === candidateId && a.jobId === jobId,
    );
    return simulateLatency(applied);
  },

  /**
   * Registra a candidatura. `sharedAccommodations` só é gravado se o candidato
   * consentir em compartilhar as acomodações com a empresa (NF2).
   */
  async apply(
    candidateId: string,
    job: Pick<Job, "id" | "title" | "companyName">,
    sharedAccommodations?: AccessibilityFeature[],
  ): Promise<Application> {
    const all = load<Application>(APPLICATIONS_KEY);
    if (all.some((a) => a.candidateId === candidateId && a.jobId === job.id)) {
      throw new ApplicationError(
        "ALREADY_APPLIED",
        "Você já se candidatou a esta vaga.",
      );
    }
    const application: Application = {
      id: makeId(),
      jobId: job.id,
      jobTitle: job.title,
      companyName: job.companyName,
      candidateId,
      status: "SENT",
      sharedAccommodations:
        sharedAccommodations && sharedAccommodations.length > 0
          ? sharedAccommodations
          : undefined,
      createdAt: new Date().toISOString(),
    };
    all.push(application);
    save(APPLICATIONS_KEY, all);
    return simulateLatency(application);
  },

  async withdraw(candidateId: string, applicationId: string): Promise<void> {
    const all = load<Application>(APPLICATIONS_KEY).filter(
      (a) => !(a.id === applicationId && a.candidateId === candidateId),
    );
    save(APPLICATIONS_KEY, all);
    await simulateLatency(null);
  },

  // --- Favoritos (C2.4) ---

  async listFavorites(candidateId: string): Promise<Favorite[]> {
    return simulateLatency(load<Favorite>(favKey(candidateId)));
  },

  async isFavorite(candidateId: string, jobId: string): Promise<boolean> {
    return simulateLatency(
      load<Favorite>(favKey(candidateId)).some((f) => f.jobId === jobId),
    );
  },

  async toggleFavorite(
    candidateId: string,
    job: Pick<Job, "id" | "title" | "companyName">,
  ): Promise<boolean> {
    const key = favKey(candidateId);
    const all = load<Favorite>(key);
    const exists = all.some((f) => f.jobId === job.id);
    const next = exists
      ? all.filter((f) => f.jobId !== job.id)
      : [
          ...all,
          {
            jobId: job.id,
            jobTitle: job.title,
            companyName: job.companyName,
            savedAt: new Date().toISOString(),
          },
        ];
    save(key, next);
    return simulateLatency(!exists); // true = agora é favorito
  },

  // --- Alertas de novas vagas (C2.4) ---

  async listAlerts(candidateId: string): Promise<JobAlert[]> {
    return simulateLatency(load<JobAlert>(alertKey(candidateId)));
  },

  async addAlert(
    candidateId: string,
    criteria: { keyword?: string; area?: string },
  ): Promise<JobAlert> {
    const key = alertKey(candidateId);
    const all = load<JobAlert>(key);
    const alert: JobAlert = {
      id: makeId(),
      keyword: criteria.keyword?.trim() || undefined,
      area: criteria.area?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    all.push(alert);
    save(key, all);
    return simulateLatency(alert);
  },

  async removeAlert(candidateId: string, alertId: string): Promise<void> {
    const key = alertKey(candidateId);
    save(
      key,
      load<JobAlert>(key).filter((a) => a.id !== alertId),
    );
    await simulateLatency(null);
  },
};

// Favoritos e alertas são por candidato (chaves derivadas).
function favKey(candidateId: string): string {
  return `${FAVORITES_KEY}.${candidateId}`;
}
function alertKey(candidateId: string): string {
  return `${ALERTS_KEY}.${candidateId}`;
}

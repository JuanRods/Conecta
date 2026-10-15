import type { AccessibilityFeature, Job } from "../jobs/types";
import type {
  Application,
  ApplicationStatus,
  Favorite,
  JobAlert,
  Notification,
} from "./types";
import { apiRequest, ApiError } from "../api/client";

/**
 * Serviço de candidaturas, favoritos e alertas — conversa com o backend real.
 *
 * NF2 / LGPD: as acomodações (dado sensível) só são anexadas à candidatura
 * quando o candidato dá consentimento explícito (`sharedAccommodations`).
 *
 * O candidato dono é inferido pelo token; os `candidateId` recebidos são
 * mantidos nas assinaturas por compatibilidade com os componentes.
 */

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

  async listByCandidate(_candidateId: string): Promise<Application[]> {
    return apiRequest<Application[]>("/candidate/applications");
  },

  async hasApplied(_candidateId: string, jobId: string): Promise<boolean> {
    const { applied } = await apiRequest<{ applied: boolean }>(
      `/candidate/applications/applied/${jobId}`,
    );
    return applied;
  },

  async apply(
    _candidateId: string,
    job: Pick<Job, "id" | "title" | "companyName">,
    sharedAccommodations?: AccessibilityFeature[],
  ): Promise<Application> {
    try {
      return await apiRequest<Application>("/candidate/applications", {
        method: "POST",
        body: { job, sharedAccommodations },
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_APPLIED") {
        throw new ApplicationError("ALREADY_APPLIED", err.message);
      }
      throw err;
    }
  },

  async withdraw(_candidateId: string, applicationId: string): Promise<void> {
    await apiRequest<void>(`/candidate/applications/${applicationId}`, {
      method: "DELETE",
    });
  },

  // --- Visão da EMPRESA (Fase 5 — E3) ---

  async listByJob(jobId: string): Promise<Application[]> {
    return apiRequest<Application[]>(`/candidate/applications/job/${jobId}`);
  },

  async updateStatus(
    applicationId: string,
    status: ApplicationStatus,
  ): Promise<Application> {
    return apiRequest<Application>(
      `/candidate/applications/${applicationId}/status`,
      { method: "PATCH", body: { status } },
    );
  },

  async listNotifications(_candidateId: string): Promise<Notification[]> {
    return apiRequest<Notification[]>("/candidate/notifications");
  },

  async purgeCandidate(_candidateId: string): Promise<void> {
    // A exclusão completa é orquestrada por DELETE /privacy/account.
    // Mantido por compatibilidade; sem efeito isolado no backend.
  },

  // --- Favoritos (C2.4) ---

  async listFavorites(_candidateId: string): Promise<Favorite[]> {
    return apiRequest<Favorite[]>("/candidate/favorites");
  },

  async isFavorite(_candidateId: string, jobId: string): Promise<boolean> {
    const { favorite } = await apiRequest<{ favorite: boolean }>(
      `/candidate/favorites/${jobId}`,
    );
    return favorite;
  },

  async toggleFavorite(
    _candidateId: string,
    job: Pick<Job, "id" | "title" | "companyName">,
  ): Promise<boolean> {
    const { favorite } = await apiRequest<{ favorite: boolean }>(
      "/candidate/favorites/toggle",
      { method: "POST", body: { job } },
    );
    return favorite; // true = agora é favorito
  },

  // --- Alertas de novas vagas (C2.4) ---

  async listAlerts(_candidateId: string): Promise<JobAlert[]> {
    return apiRequest<JobAlert[]>("/candidate/alerts");
  },

  async addAlert(
    _candidateId: string,
    criteria: { keyword?: string; area?: string },
  ): Promise<JobAlert> {
    return apiRequest<JobAlert>("/candidate/alerts", {
      method: "POST",
      body: criteria,
    });
  },

  async removeAlert(_candidateId: string, alertId: string): Promise<void> {
    await apiRequest<void>(`/candidate/alerts/${alertId}`, { method: "DELETE" });
  },
};

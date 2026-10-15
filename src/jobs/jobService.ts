import type {
  AccessibilityFeature,
  Job,
  JobFilters,
  JobStatus,
} from "./types";
import { apiRequest, toQuery } from "../api/client";

/**
 * Serviço de vagas — conversa com o backend real.
 *
 * Busca pública (GET /jobs, GET /jobs/:id) é anônima e expõe apenas vagas
 * APPROVED (regra aplicada no servidor). As operações da EMPRESA e da MODERAÇÃO
 * exigem token (anexado automaticamente pelo cliente HTTP) e o backend infere a
 * empresa dona a partir do token — por isso os parâmetros `companyId` recebidos
 * aqui são ignorados, preservando a assinatura pública usada pelos componentes.
 */

export const jobService = {
  async search(filters: JobFilters = {}): Promise<Job[]> {
    const query = toQuery({
      keyword: filters.keyword,
      location: filters.location,
      modality: filters.modality,
      level: filters.level,
      area: filters.area,
      features: filters.features,
    });
    return apiRequest<Job[]>(`/jobs${query}`, { anonymous: true });
  },

  async getById(id: string): Promise<Job | null> {
    try {
      return await apiRequest<Job>(`/jobs/${id}`, { anonymous: true });
    } catch {
      return null;
    }
  },

  async listAreas(): Promise<string[]> {
    return apiRequest<string[]>("/jobs/areas", { anonymous: true });
  },

  // --- Operações da EMPRESA (dona inferida pelo token) ---

  async listByCompany(_companyId: string): Promise<Job[]> {
    return apiRequest<Job[]>("/jobs/mine");
  },

  async getOwnedById(_companyId: string, id: string): Promise<Job | null> {
    try {
      return await apiRequest<Job>(`/jobs/mine/${id}`);
    } catch {
      return null;
    }
  },

  async create(
    input: Omit<Job, "id" | "status" | "createdAt" | "publishedAt">,
  ): Promise<Job> {
    return apiRequest<Job>("/jobs", { method: "POST", body: input });
  },

  async update(
    _companyId: string,
    id: string,
    patch: Partial<Omit<Job, "id" | "companyId" | "status" | "createdAt">>,
  ): Promise<Job> {
    return apiRequest<Job>(`/jobs/mine/${id}`, { method: "PATCH", body: patch });
  },

  async setStatus(
    _companyId: string,
    id: string,
    status: JobStatus,
  ): Promise<Job> {
    return apiRequest<Job>(`/jobs/mine/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async duplicate(_companyId: string, id: string): Promise<Job> {
    return apiRequest<Job>(`/jobs/mine/${id}/duplicate`, { method: "POST" });
  },

  async submitForReview(companyId: string, id: string): Promise<Job> {
    return this.setStatus(companyId, id, "PENDING");
  },

  async remove(_companyId: string, id: string): Promise<void> {
    await apiRequest<void>(`/jobs/mine/${id}`, { method: "DELETE" });
  },

  // --- Operações de MODERAÇÃO (Fase 6 — M1) ---

  async listPending(): Promise<Job[]> {
    return apiRequest<Job[]>("/jobs/pending");
  },

  async approve(id: string): Promise<Job> {
    return apiRequest<Job>(`/jobs/${id}/approve`, { method: "POST" });
  },

  async reject(id: string): Promise<Job> {
    return apiRequest<Job>(`/jobs/${id}/reject`, { method: "POST" });
  },
};

export type { AccessibilityFeature };

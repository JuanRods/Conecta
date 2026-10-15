import { apiRequest } from "../api/client";
import { JOB_STATUS_LABELS, type JobStatus } from "../jobs/types";

/**
 * Serviço de métricas do administrador (Fase 6 — M3) — conversa com o backend
 * real (GET /metrics). A agregação é feita no servidor (SQL); aqui apenas
 * consumimos o resultado e geramos o CSV acessível.
 */

export interface AdminMetrics {
  users: { total: number; candidates: number; companies: number; suspended: number };
  jobsByStatus: Record<JobStatus, number>;
  companies: { total: number; verified: number; pending: number };
  reports: { pending: number };
}

export const metricsService = {
  async get(): Promise<AdminMetrics> {
    return apiRequest<AdminMetrics>("/metrics");
  },

  /** Gera o CSV das métricas (M3). */
  toCsv(metrics: AdminMetrics): string {
    const rows: [string, string | number][] = [
      ["Métrica", "Valor"],
      ["Usuários (total)", metrics.users.total],
      ["Candidatos", metrics.users.candidates],
      ["Empresas", metrics.users.companies],
      ["Contas suspensas", metrics.users.suspended],
      ["Empresas verificadas", metrics.companies.verified],
      ["Empresas pendentes", metrics.companies.pending],
      ["Denúncias pendentes", metrics.reports.pending],
    ];
    for (const status of Object.keys(metrics.jobsByStatus) as JobStatus[]) {
      rows.push([
        `Vagas: ${JOB_STATUS_LABELS[status]}`,
        metrics.jobsByStatus[status],
      ]);
    }
    return rows
      .map(([k, v]) => `"${String(k).replace(/"/g, '""')}",${v}`)
      .join("\r\n");
  },
};

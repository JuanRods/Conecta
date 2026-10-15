import { jobService } from "../jobs/jobService";
import { companyService } from "../company/companyService";
import { reportService } from "../candidate/reportService";
import { authService } from "../auth/authService";
import { JOB_STATUS_LABELS, type JobStatus } from "../jobs/types";

/**
 * Serviço de métricas do administrador (Fase 6 — M3).
 * Agrega contagens e permite exportação em CSV acessível.
 */

export interface AdminMetrics {
  users: { total: number; candidates: number; companies: number; suspended: number };
  jobsByStatus: Record<JobStatus, number>;
  companies: { total: number; verified: number; pending: number };
  reports: { pending: number };
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

export const metricsService = {
  async get(): Promise<AdminMetrics> {
    const [users, companies, pendingReports] = await Promise.all([
      authService.listUsers(),
      // listByCompany sem id não existe; usamos a verificação para total parcial
      companyService.listPendingVerification(),
      reportService.listPending(),
    ]);

    // Agrega vagas por status varrendo todas as empresas conhecidas via usuários.
    const companyUsers = users.filter((u) => u.role === "COMPANY");
    const jobsByStatus = emptyStatusCount();
    for (const cu of companyUsers) {
      const jobs = await jobService.listByCompany(cu.id);
      for (const job of jobs) jobsByStatus[job.status] += 1;
    }

    const verifiedCount = companyUsers.length - companies.length;

    return simulateLatency({
      users: {
        total: users.length,
        candidates: users.filter((u) => u.role === "CANDIDATE").length,
        companies: companyUsers.length,
        suspended: users.filter((u) => u.status === "SUSPENDED").length,
      },
      jobsByStatus,
      companies: {
        total: companyUsers.length,
        verified: Math.max(0, verifiedCount),
        pending: companies.length,
      },
      reports: { pending: pendingReports.length },
    });
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

function emptyStatusCount(): Record<JobStatus, number> {
  return {
    DRAFT: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    PAUSED: 0,
    CLOSED: 0,
  };
}

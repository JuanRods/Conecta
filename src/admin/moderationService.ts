import { jobService } from "../jobs/jobService";
import { companyService } from "../company/companyService";
import { campaignService } from "../campaigns/campaignService";
import { reportService } from "../candidate/reportService";
import { authService } from "../auth/authService";
import type {
  ModerationAction,
  ModerationActionType,
  ModerationTargetType,
} from "./types";

/**
 * Serviço de moderação (Fase 6 — M1, M2).
 *
 * NOTA DE AMBIENTE: MOCK em localStorage. Orquestra ações sobre vagas, empresas,
 * denúncias e contas, registrando TODAS as ações em um log de auditoria imutável
 * (M1.4 / NF8) e notificando os autores quando aplicável (M1.3).
 */

const AUDIT_KEY = "conecta.moderation.audit";
/** Notificações gerais por usuário (empresa/candidato) — mudanças de moderação. */
const USER_NOTIF_KEY = "conecta.user.notifications";

export interface UserNotification {
  type: "MODERATION";
  message: string;
  createdAt: string;
}

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `mod-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

function loadAudit(): ModerationAction[] {
  try {
    return JSON.parse(
      localStorage.getItem(AUDIT_KEY) ?? "[]",
    ) as ModerationAction[];
  } catch {
    return [];
  }
}

function record(entry: Omit<ModerationAction, "id" | "createdAt">) {
  const all = loadAudit();
  all.unshift({ ...entry, id: makeId(), createdAt: new Date().toISOString() });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(all));
}

function notifyUser(userId: string, message: string) {
  const key = `${USER_NOTIF_KEY}.${userId}`;
  let list: UserNotification[] = [];
  try {
    list = JSON.parse(localStorage.getItem(key) ?? "[]") as UserNotification[];
  } catch {
    list = [];
  }
  list.unshift({ type: "MODERATION", message, createdAt: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(list));
}

interface Admin {
  id: string;
  name: string;
}

export const moderationService = {
  // --- Fila agregada (M1.1) ---
  async getQueueCounts(): Promise<{
    jobs: number;
    companies: number;
    reports: number;
    campaigns: number;
  }> {
    const [jobs, companies, reports, campaigns] = await Promise.all([
      jobService.listPending(),
      companyService.listPendingVerification(),
      reportService.listPending(),
      campaignService.listPending(),
    ]);
    return simulateLatency({
      jobs: jobs.length,
      companies: companies.length,
      reports: reports.length,
      campaigns: campaigns.length,
    });
  },

  // --- Vagas (M1.2, M1.3) ---
  async approveJob(admin: Admin, jobId: string): Promise<void> {
    const job = await jobService.approve(jobId);
    audit(admin, "JOB", jobId, job.title, "APPROVE");
    notifyUser(job.companyId, `Sua vaga "${job.title}" foi aprovada e publicada.`);
    await simulateLatency(null);
  },

  async rejectJob(
    admin: Admin,
    jobId: string,
    reason: string,
    requestChanges = false,
  ): Promise<void> {
    const job = await jobService.reject(jobId);
    audit(
      admin,
      "JOB",
      jobId,
      job.title,
      requestChanges ? "REQUEST_CHANGES" : "REJECT",
      reason,
    );
    notifyUser(
      job.companyId,
      `Sua vaga "${job.title}" foi ${
        requestChanges ? "devolvida para ajustes" : "rejeitada"
      }. Motivo: ${reason}`,
    );
    await simulateLatency(null);
  },

  // --- Empresas (E1.3 / M1) ---
  async verifyCompany(admin: Admin, userId: string): Promise<void> {
    const company = await companyService.setVerification(userId, "VERIFIED");
    audit(admin, "COMPANY", userId, company.name, "VERIFY");
    notifyUser(userId, "Sua empresa foi verificada. Parabéns!");
    await simulateLatency(null);
  },

  async rejectCompanyVerification(
    admin: Admin,
    userId: string,
    reason: string,
  ): Promise<void> {
    const company = await companyService.setVerification(userId, "REJECTED");
    audit(admin, "COMPANY", userId, company.name, "REJECT_VERIFICATION", reason);
    notifyUser(userId, `A verificação da sua empresa foi recusada. Motivo: ${reason}`);
    await simulateLatency(null);
  },

  // --- Denúncias (M2.1) ---
  async archiveReport(
    admin: Admin,
    reportId: string,
    targetLabel: string,
  ): Promise<void> {
    await reportService.setStatus(reportId, "ARCHIVED");
    audit(admin, "REPORT", reportId, targetLabel, "ARCHIVE_REPORT");
    await simulateLatency(null);
  },

  // --- Contas (M2.5) ---
  async suspendUser(
    admin: Admin,
    userId: string,
    userName: string,
    reason: string,
  ): Promise<void> {
    await authService.setUserStatus(userId, "SUSPENDED");
    audit(admin, "USER", userId, userName, "SUSPEND_USER", reason);
    notifyUser(userId, `Sua conta foi suspensa. Motivo: ${reason}`);
    await simulateLatency(null);
  },

  async reactivateUser(
    admin: Admin,
    userId: string,
    userName: string,
  ): Promise<void> {
    await authService.setUserStatus(userId, "ACTIVE");
    audit(admin, "USER", userId, userName, "REACTIVATE_USER");
    notifyUser(userId, "Sua conta foi reativada.");
    await simulateLatency(null);
  },

  // --- Auditoria (M1.4 / NF8) ---
  async listAudit(): Promise<ModerationAction[]> {
    return simulateLatency(loadAudit());
  },
};

function audit(
  admin: Admin,
  targetType: ModerationTargetType,
  targetId: string,
  targetLabel: string,
  action: ModerationActionType,
  reason?: string,
) {
  record({
    adminId: admin.id,
    adminName: admin.name,
    targetType,
    targetId,
    targetLabel,
    action,
    reason,
  });
}

export function loadUserNotifications(userId: string): UserNotification[] {
  try {
    return JSON.parse(
      localStorage.getItem(`${USER_NOTIF_KEY}.${userId}`) ?? "[]",
    ) as UserNotification[];
  } catch {
    return [];
  }
}

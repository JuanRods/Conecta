import { apiRequest } from "../api/client";
import type { ModerationAction } from "./types";

/**
 * Serviço de moderação (Fase 6 — M1, M2) — conversa com o backend real
 * (rotas /moderation/*). O servidor executa cada ação em transação, registra o
 * log de auditoria imutável (M1.4 / NF8) e notifica os autores (M1.3).
 *
 * O administrador é inferido pelo token no backend; o parâmetro `admin` é
 * mantido nas assinaturas por compatibilidade com os componentes.
 */

export interface UserNotification {
  type: "MODERATION";
  message: string;
  createdAt: string;
}

interface Admin {
  id: string;
  name: string;
}

export const moderationService = {
  async getQueueCounts(): Promise<{
    jobs: number;
    companies: number;
    reports: number;
  }> {
    return apiRequest("/moderation/queue");
  },

  // --- Vagas (M1.2, M1.3) ---
  async approveJob(_admin: Admin, jobId: string): Promise<void> {
    await apiRequest<void>(`/moderation/jobs/${jobId}/approve`, {
      method: "POST",
    });
  },

  async rejectJob(
    _admin: Admin,
    jobId: string,
    reason: string,
    requestChanges = false,
  ): Promise<void> {
    await apiRequest<void>(`/moderation/jobs/${jobId}/reject`, {
      method: "POST",
      body: { reason, requestChanges },
    });
  },

  // --- Empresas (E1.3 / M1) ---
  async verifyCompany(_admin: Admin, userId: string): Promise<void> {
    await apiRequest<void>(`/moderation/companies/${userId}/verify`, {
      method: "POST",
    });
  },

  async rejectCompanyVerification(
    _admin: Admin,
    userId: string,
    reason: string,
  ): Promise<void> {
    await apiRequest<void>(`/moderation/companies/${userId}/reject`, {
      method: "POST",
      body: { reason },
    });
  },

  // --- Denúncias (M2.1) ---
  async archiveReport(
    _admin: Admin,
    reportId: string,
    targetLabel: string,
  ): Promise<void> {
    await apiRequest<void>(`/moderation/reports/${reportId}/archive`, {
      method: "POST",
      body: { targetLabel },
    });
  },

  // --- Contas (M2.5) ---
  async suspendUser(
    _admin: Admin,
    userId: string,
    userName: string,
    reason: string,
  ): Promise<void> {
    await apiRequest<void>(`/moderation/users/${userId}/suspend`, {
      method: "POST",
      body: { userName, reason },
    });
  },

  async reactivateUser(
    _admin: Admin,
    userId: string,
    userName: string,
  ): Promise<void> {
    await apiRequest<void>(`/moderation/users/${userId}/reactivate`, {
      method: "POST",
      body: { userName },
    });
  },

  // --- Auditoria (M1.4 / NF8) ---
  async listAudit(): Promise<ModerationAction[]> {
    return apiRequest<ModerationAction[]>("/moderation/audit");
  },

  /** Notificações de moderação do usuário atual (empresa/candidato). */
  async listUserNotifications(): Promise<UserNotification[]> {
    return apiRequest<UserNotification[]>("/moderation/notifications");
  },
};

/**
 * Mantido por compatibilidade de API. As notificações de moderação agora vêm do
 * backend; use `moderationService.listUserNotifications()` (assíncrono).
 */
export async function loadUserNotifications(): Promise<UserNotification[]> {
  return moderationService.listUserNotifications();
}

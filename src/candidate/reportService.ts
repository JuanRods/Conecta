import type { Report, ReportReason, ReportTargetType } from "./types";
import { apiRequest } from "../api/client";

/**
 * Serviço de denúncias — conversa com o backend real
 * (POST /reports, GET /reports/pending, PATCH /reports/:id/status).
 *
 * As denúncias entram com status PENDING e alimentam a fila de moderação
 * (Fase 6 / M1). O denunciante é inferido pelo token.
 */

export const reportService = {
  async submit(input: {
    targetType: ReportTargetType;
    targetId: string;
    targetLabel: string;
    reporterId: string;
    reason: ReportReason;
    details?: string;
  }): Promise<Report> {
    return apiRequest<Report>("/reports", {
      method: "POST",
      body: {
        targetType: input.targetType,
        targetId: input.targetId,
        targetLabel: input.targetLabel,
        reason: input.reason,
        details: input.details,
      },
    });
  },

  async listPending(): Promise<Report[]> {
    return apiRequest<Report[]>("/reports/pending");
  },

  async setStatus(
    reportId: string,
    status: Report["status"],
  ): Promise<Report> {
    return apiRequest<Report>(`/reports/${reportId}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async listByReporter(_reporterId: string): Promise<Report[]> {
    // Exposto na exportação LGPD via GET /privacy/export.
    const data = await apiRequest<{ reports: Report[] }>("/privacy/export");
    return data.reports;
  },

  async purgeByReporter(_reporterId: string): Promise<void> {
    // A exclusão completa é orquestrada por DELETE /privacy/account.
  },
};

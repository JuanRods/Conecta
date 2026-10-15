/**
 * Tipos de domínio da Moderação / Administração (Fase 6).
 * Alinhados ao design: ModerationAction(id, adminId, targetType, targetId,
 * action, reason, createdAt) — log de auditoria (M1.4 / NF8).
 */

export type ModerationTargetType = "JOB" | "COMPANY" | "REPORT" | "USER";

export type ModerationActionType =
  | "APPROVE"
  | "REJECT"
  | "REQUEST_CHANGES"
  | "VERIFY"
  | "REJECT_VERIFICATION"
  | "ARCHIVE_REPORT"
  | "SUSPEND_USER"
  | "REACTIVATE_USER";

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  APPROVE: "Aprovou",
  REJECT: "Rejeitou",
  REQUEST_CHANGES: "Solicitou ajustes",
  VERIFY: "Verificou",
  REJECT_VERIFICATION: "Recusou verificação",
  ARCHIVE_REPORT: "Arquivou denúncia",
  SUSPEND_USER: "Suspendeu conta",
  REACTIVATE_USER: "Reativou conta",
};

/** Registro imutável de auditoria (M1.4 / NF8). */
export interface ModerationAction {
  id: string;
  adminId: string;
  adminName: string;
  targetType: ModerationTargetType;
  targetId: string;
  targetLabel: string;
  action: ModerationActionType;
  reason?: string;
  createdAt: string;
}

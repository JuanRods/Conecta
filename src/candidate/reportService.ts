import type { Report, ReportReason, ReportTargetType } from "./types";

/**
 * Serviço de denúncias (Fase 4 — C3).
 *
 * NOTA DE AMBIENTE: MOCK em localStorage. As denúncias entram com status
 * PENDING e alimentam a fila de moderação (Fase 6 / M1). A chave é compartilhada
 * para que o painel do administrador leia as mesmas denúncias.
 */

const REPORTS_KEY = "conecta.reports";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `rep-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

function load(): Report[] {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) ?? "[]") as Report[];
  } catch {
    return [];
  }
}

export const reportService = {
  /** Envia uma denúncia à fila de moderação (C3.1, C3.2). */
  async submit(input: {
    targetType: ReportTargetType;
    targetId: string;
    targetLabel: string;
    reporterId: string;
    reason: ReportReason;
    details?: string;
  }): Promise<Report> {
    const all = load();
    const report: Report = {
      id: makeId(),
      targetType: input.targetType,
      targetId: input.targetId,
      targetLabel: input.targetLabel,
      reporterId: input.reporterId,
      reason: input.reason,
      details: input.details?.trim() || undefined,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    all.push(report);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    return simulateLatency(report);
  },

  /** Fila de denúncias pendentes (consumida pela moderação na Fase 6). */
  async listPending(): Promise<Report[]> {
    return simulateLatency(load().filter((r) => r.status === "PENDING"));
  },

  /** Marca uma denúncia como analisada/arquivada (M2.1). */
  async setStatus(
    reportId: string,
    status: Report["status"],
  ): Promise<Report> {
    const all = load();
    const idx = all.findIndex((r) => r.id === reportId);
    if (idx === -1) throw new Error("Denúncia não encontrada.");
    all[idx] = { ...all[idx], status };
    localStorage.setItem(REPORTS_KEY, JSON.stringify(all));
    return simulateLatency(all[idx]);
  },
};

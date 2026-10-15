import { authService } from "../auth/authService";
import { profileService } from "../candidate/profileService";
import { applicationService } from "../candidate/applicationService";
import { reportService } from "../candidate/reportService";
import type { User } from "../auth/types";

/**
 * Serviço de privacidade / LGPD (Fase 7 — NF2).
 *
 * Centraliza os direitos do titular dos dados:
 *  - Consentimento de tratamento de dados (registro + versão).
 *  - Portabilidade: exportação de TODOS os dados do usuário em JSON.
 *  - Direito à exclusão: remoção da conta e de todos os dados associados.
 *
 * NOTA DE AMBIENTE: MOCK em localStorage. No backend, a exclusão deve ser
 * propagada a todos os armazenamentos (incluindo backups, conforme política) e
 * registrada em auditoria de acesso a dados sensíveis (NF8).
 */

const CONSENT_KEY = "conecta.privacy.consent";

/** Versão atual do aviso de privacidade/consentimento. */
export const CONSENT_VERSION = "2026-10-15";

export interface ConsentRecord {
  userId: string;
  version: string;
  acceptedAt: string;
}

function loadConsents(): ConsentRecord[] {
  try {
    return JSON.parse(
      localStorage.getItem(CONSENT_KEY) ?? "[]",
    ) as ConsentRecord[];
  } catch {
    return [];
  }
}

function saveConsents(list: ConsentRecord[]) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(list));
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 200));
}

export interface DataExport {
  exportedAt: string;
  account: User;
  consent: ConsentRecord | null;
  profile: unknown;
  applications: unknown;
  favorites: unknown;
  alerts: unknown;
  notifications: unknown;
  reports: unknown;
}

export const privacyService = {
  // --- Consentimento ---

  /** Verifica se o usuário aceitou a versão atual do consentimento. */
  hasConsented(userId: string): boolean {
    return loadConsents().some(
      (c) => c.userId === userId && c.version === CONSENT_VERSION,
    );
  },

  getConsent(userId: string): ConsentRecord | null {
    return (
      loadConsents().find(
        (c) => c.userId === userId && c.version === CONSENT_VERSION,
      ) ?? null
    );
  },

  async recordConsent(userId: string): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      userId,
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    const others = loadConsents().filter((c) => c.userId !== userId);
    saveConsents([...others, record]);
    return simulateLatency(record);
  },

  async revokeConsent(userId: string): Promise<void> {
    saveConsents(loadConsents().filter((c) => c.userId !== userId));
    await simulateLatency(null);
  },

  // --- Portabilidade (exportação) ---

  /** Reúne todos os dados do candidato para portabilidade (JSON). */
  async exportCandidateData(user: User): Promise<DataExport> {
    const [profile, applications, favorites, alerts, notifications, reports] =
      await Promise.all([
        profileService.get(user.id),
        applicationService.listByCandidate(user.id),
        applicationService.listFavorites(user.id),
        applicationService.listAlerts(user.id),
        applicationService.listNotifications(user.id),
        reportService.listByReporter(user.id),
      ]);
    return simulateLatency({
      exportedAt: new Date().toISOString(),
      account: user,
      consent: this.getConsent(user.id),
      profile,
      applications,
      favorites,
      alerts,
      notifications,
      reports,
    });
  },

  // --- Direito à exclusão ---

  /**
   * Exclui a conta e TODOS os dados do candidato. Encerra a sessão ao final.
   */
  async deleteCandidateAccount(userId: string): Promise<void> {
    await profileService.delete(userId);
    await applicationService.purgeCandidate(userId);
    await reportService.purgeByReporter(userId);
    await this.revokeConsent(userId);
    await authService.deleteUser(userId);
    await simulateLatency(null);
  },
};

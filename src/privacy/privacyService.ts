import { authService } from "../auth/authService";
import { apiRequest } from "../api/client";
import type { User } from "../auth/types";

/**
 * Serviço de privacidade / LGPD (Fase 7 — NF2) — conversa com o backend real
 * (/privacy/consent, /privacy/export, /privacy/account).
 *
 * `getConsent`/`hasConsented` permanecem SÍNCRONOS (a UI os chama assim) usando
 * um cache local do consentimento, mantido em sincronia pelas chamadas
 * assíncronas `refreshConsent`/`recordConsent`/`revokeConsent`.
 */

/** Versão atual do aviso de privacidade/consentimento. */
export const CONSENT_VERSION = "2026-10-15";

const CONSENT_CACHE_KEY = "conecta.privacy.consentCache";

export interface ConsentRecord {
  userId: string;
  version: string;
  acceptedAt: string;
}

interface ConsentState {
  version: string;
  consented: boolean;
  consent: ConsentRecord | null;
}

function readCache(): Record<string, ConsentRecord | null> {
  try {
    return JSON.parse(localStorage.getItem(CONSENT_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeCache(userId: string, record: ConsentRecord | null) {
  try {
    const cache = readCache();
    cache[userId] = record;
    localStorage.setItem(CONSENT_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignora */
  }
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

  /** Leitura SÍNCRONA do cache local (preenchido por refreshConsent). */
  hasConsented(userId: string): boolean {
    const record = readCache()[userId];
    return !!record && record.version === CONSENT_VERSION;
  },

  /** Leitura SÍNCRONA do cache local. */
  getConsent(userId: string): ConsentRecord | null {
    return readCache()[userId] ?? null;
  },

  /** Busca o estado de consentimento no backend e atualiza o cache local. */
  async refreshConsent(userId: string): Promise<ConsentRecord | null> {
    try {
      const state = await apiRequest<ConsentState>("/privacy/consent");
      writeCache(userId, state.consent);
      return state.consent;
    } catch {
      return this.getConsent(userId);
    }
  },

  async recordConsent(userId: string): Promise<ConsentRecord> {
    const record = await apiRequest<ConsentRecord>("/privacy/consent", {
      method: "POST",
    });
    writeCache(userId, record);
    return record;
  },

  async revokeConsent(userId: string): Promise<void> {
    await apiRequest<void>("/privacy/consent", { method: "DELETE" });
    writeCache(userId, null);
  },

  // --- Portabilidade (exportação) ---

  async exportCandidateData(_user: User): Promise<DataExport> {
    return apiRequest<DataExport>("/privacy/export");
  },

  // --- Direito à exclusão ---

  async deleteCandidateAccount(userId: string): Promise<void> {
    await apiRequest<void>("/privacy/account", { method: "DELETE" });
    writeCache(userId, null);
    // Encerra a sessão local após a exclusão no servidor.
    authService.logout();
  },
};

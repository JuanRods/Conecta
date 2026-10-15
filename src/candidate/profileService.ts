import type { CandidateProfile, ResumeFile, SensitiveInfo } from "./types";
import { api, apiEnabled } from "../api/client";

/**
 * Serviço de perfil do candidato (Fase 4 — C1).
 *
 * NOTA DE AMBIENTE: sandbox INTEGRATIONS_ONLY (sem backend). Implementação MOCK
 * em localStorage, com interface pronta para um cliente HTTP real.
 *
 * LGPD / NF2: o bloco `sensitive` (tipo de deficiência e acomodações) é
 * "criptografado em repouso". Aqui usamos uma ofuscação simbólica (base64) só
 * para demonstrar o contrato — NÃO é criptografia real. No backend, usar KMS/
 * criptografia autenticada e acesso auditado.
 */

const PROFILES_KEY = "conecta.candidate.profiles";

interface StoredProfile extends Omit<CandidateProfile, "sensitive"> {
  /** Campo sensível guardado "cifrado". */
  sensitiveEnc: string;
}

function encrypt(info: SensitiveInfo): string {
  // SIMULAÇÃO — ver nota acima. Nunca use base64 como segurança real.
  return `enc:${btoa(unescape(encodeURIComponent(JSON.stringify(info))))}`;
}

function decrypt(enc: string): SensitiveInfo {
  const empty: SensitiveInfo = { accommodations: [] };
  try {
    if (!enc.startsWith("enc:")) return empty;
    const json = decodeURIComponent(escape(atob(enc.slice(4))));
    const parsed = JSON.parse(json) as SensitiveInfo;
    return { ...parsed, accommodations: parsed.accommodations ?? [] };
  } catch {
    return empty;
  }
}

function loadAll(): StoredProfile[] {
  try {
    return JSON.parse(
      localStorage.getItem(PROFILES_KEY) ?? "[]",
    ) as StoredProfile[];
  } catch {
    return [];
  }
}

function saveAll(profiles: StoredProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

function toProfile(stored: StoredProfile): CandidateProfile {
  const { sensitiveEnc, ...rest } = stored;
  return { ...rest, sensitive: decrypt(sensitiveEnc) };
}

function emptyProfile(userId: string): CandidateProfile {
  return {
    userId,
    headline: "",
    bio: "",
    skills: [],
    experience: "",
    education: "",
    salaryExpectation: "",
    visibility: "APPLIED_ONLY",
    sensitive: { accommodations: [] },
    updatedAt: new Date().toISOString(),
  };
}

export const profileService = {
  /** Retorna o perfil do usuário, ou um perfil vazio pronto para edição. */
  async get(userId: string): Promise<CandidateProfile> {
    if (apiEnabled()) {
      const remote = await api
        .get<RemoteProfile>(`/candidates/${userId}/profile`)
        .catch(() => null);
      if (!remote) return emptyProfile(userId);
      // O bloco sensível chega CIFRADO do servidor e é decifrado aqui (NF2).
      const { sensitiveEnc, ...rest } = remote;
      return { ...rest, sensitive: decrypt(sensitiveEnc) };
    }
    const found = loadAll().find((p) => p.userId === userId);
    return simulateLatency(found ? toProfile(found) : emptyProfile(userId));
  },

  /** Indica se já existe perfil salvo (para a UI diferenciar criação/edição). */
  async exists(userId: string): Promise<boolean> {
    if (apiEnabled()) {
      const remote = await api
        .get<RemoteProfile>(`/candidates/${userId}/profile`)
        .catch(() => null);
      return remote !== null && remote.headline.trim().length > 0;
    }
    return simulateLatency(loadAll().some((p) => p.userId === userId));
  },

  async save(profile: CandidateProfile): Promise<CandidateProfile> {
    if (apiEnabled()) {
      const { sensitive, ...rest } = profile;
      const saved = await api.put<RemoteProfile>(
        `/candidates/${profile.userId}/profile`,
        { ...rest, sensitiveEnc: encrypt(sensitive) },
      );
      const { sensitiveEnc, ...plain } = saved;
      return { ...plain, sensitive: decrypt(sensitiveEnc) };
    }
    const { sensitive, ...rest } = profile;
    const stored: StoredProfile = {
      ...rest,
      updatedAt: new Date().toISOString(),
      sensitiveEnc: encrypt(sensitive),
    };
    const all = loadAll().filter((p) => p.userId !== profile.userId);
    all.push(stored);
    saveAll(all);
    return simulateLatency(toProfile(stored));
  },

  /** Remove o currículo anexado. */
  async removeResume(userId: string): Promise<CandidateProfile> {
    const current = await this.get(userId);
    return this.save({ ...current, resume: undefined });
  },

  /** Apaga o perfil do usuário (direito à exclusão — LGPD/NF2). */
  async delete(userId: string): Promise<void> {
    if (apiEnabled()) {
      // A exclusão total do titular é feita via privacyService (/privacy/:id).
      await api.put(`/candidates/${userId}/profile`, {
        headline: "", bio: "", skills: [], experience: "", education: "",
        visibility: "PRIVATE", sensitiveEnc: "",
      });
      return;
    }
    saveAll(loadAll().filter((p) => p.userId !== userId));
    await simulateLatency(null);
  },
};

/** Formatos de currículo aceitos (C1.3) — PDF e Word. */
export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export const ACCEPTED_RESUME_EXTENSIONS = ".pdf,.doc,.docx";

export function isAcceptedResume(file: { name: string; type: string }): boolean {
  if (ACCEPTED_RESUME_TYPES.includes(file.type)) return true;
  // Fallback por extensão (alguns navegadores não preenchem o MIME de .docx).
  return /\.(pdf|docx?|doc)$/i.test(file.name);
}

/** Formato do perfil como trafega na API: bloco sensível cifrado. */
interface RemoteProfile extends Omit<CandidateProfile, "sensitive"> {
  sensitiveEnc: string;
}

export type { ResumeFile };

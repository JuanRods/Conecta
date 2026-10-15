import type { CandidateProfile, ResumeFile, SensitiveInfo } from "./types";

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
    const found = loadAll().find((p) => p.userId === userId);
    return simulateLatency(found ? toProfile(found) : emptyProfile(userId));
  },

  /** Indica se já existe perfil salvo (para a UI diferenciar criação/edição). */
  async exists(userId: string): Promise<boolean> {
    return simulateLatency(loadAll().some((p) => p.userId === userId));
  },

  async save(profile: CandidateProfile): Promise<CandidateProfile> {
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

export type { ResumeFile };

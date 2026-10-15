import type { CandidateProfile, ResumeFile } from "./types";
import { apiRequest } from "../api/client";

/**
 * Serviço de perfil do candidato — conversa com o backend real
 * (GET/PUT/DELETE /candidate/profile).
 *
 * LGPD / NF2: o bloco `sensitive` (tipo de deficiência e acomodações) é enviado
 * ao backend, que o criptografa em repouso com AES-256-GCM (criptografia
 * autenticada). O candidato dono é inferido pelo token; o `userId` recebido é
 * mantido na assinatura por compatibilidade com os componentes.
 */

export const profileService = {
  async get(_userId: string): Promise<CandidateProfile> {
    return apiRequest<CandidateProfile>("/candidate/profile");
  },

  async exists(_userId: string): Promise<boolean> {
    const { exists } = await apiRequest<{ exists: boolean }>(
      "/candidate/profile/exists",
    );
    return exists;
  },

  async save(profile: CandidateProfile): Promise<CandidateProfile> {
    return apiRequest<CandidateProfile>("/candidate/profile", {
      method: "PUT",
      body: profile,
    });
  },

  async removeResume(userId: string): Promise<CandidateProfile> {
    const current = await this.get(userId);
    return this.save({ ...current, resume: undefined });
  },

  async delete(_userId: string): Promise<void> {
    await apiRequest<void>("/candidate/profile", { method: "DELETE" });
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

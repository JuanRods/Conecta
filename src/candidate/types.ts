import type { AccessibilityFeature } from "../jobs/types";

/**
 * Tipos de domínio do Perfil Candidato (Fase 4).
 * Alinhados ao modelo de dados do design (.kiro/specs/conecta-inclusao/design.md):
 *   CandidateProfile(userId, headline, bio, skills[], disabilityType?,
 *       accommodations[], visibility, resumeFileId?)
 *   Application(id, jobId, candidateId, status, sharedAccommodations?, createdAt)
 *   Report(id, targetType, targetId, reporterId, reason, status)
 */

/** Visibilidade do perfil (C1.4). */
export type ProfileVisibility = "PUBLIC" | "APPLIED_ONLY" | "PRIVATE";

export const VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  PUBLIC: "Público — qualquer empresa pode encontrar meu perfil",
  APPLIED_ONLY: "Restrito — apenas empresas das vagas em que me candidatei",
  PRIVATE: "Privado — meu perfil não aparece em buscas",
};

/** Tipo de deficiência — dado sensível, opcional e sigiloso (C1.2 / NF2). */
export type DisabilityType =
  | "PHYSICAL"
  | "VISUAL"
  | "HEARING"
  | "INTELLECTUAL"
  | "PSYCHOSOCIAL"
  | "MULTIPLE"
  | "OTHER";

export const DISABILITY_LABELS: Record<DisabilityType, string> = {
  PHYSICAL: "Física",
  VISUAL: "Visual",
  HEARING: "Auditiva",
  INTELLECTUAL: "Intelectual",
  PSYCHOSOCIAL: "Psicossocial",
  MULTIPLE: "Múltipla",
  OTHER: "Outra / prefiro descrever",
};

/** Metadados do currículo anexado (C1.3). */
export interface ResumeFile {
  name: string;
  /** MIME type — restringimos a formatos acessíveis (PDF/.docx). */
  type: string;
  size: number;
  /** Data URL do conteúdo (mock de armazenamento — Fase 4 sem backend). */
  dataUrl: string;
  uploadedAt: string;
}

/**
 * Bloco sensível do perfil (C1.2). Criptografado em repouso (ver profileService).
 * `shareWithAppliedCompanies` registra o consentimento global; o consentimento
 * por candidatura é feito em `Application.sharedAccommodations` (C2.2 / NF2).
 */
export interface SensitiveInfo {
  disabilityType?: DisabilityType;
  disabilityNote?: string;
  accommodations: AccessibilityFeature[];
}

export interface CandidateProfile {
  userId: string;
  headline: string;
  bio: string;
  skills: string[];
  experience: string;
  education: string;
  salaryExpectation?: string;
  visibility: ProfileVisibility;
  resume?: ResumeFile;
  sensitive: SensitiveInfo;
  updatedAt: string;
}

// --- Candidaturas (C2) ---

export type ApplicationStatus = "SENT" | "REVIEW" | "INTERVIEW" | "FINISHED";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SENT: "Enviada",
  REVIEW: "Em análise",
  INTERVIEW: "Entrevista",
  FINISHED: "Finalizada",
};

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  status: ApplicationStatus;
  /** Acomodações compartilhadas com a empresa, mediante consentimento (NF2). */
  sharedAccommodations?: AccessibilityFeature[];
  createdAt: string;
}

// --- Favoritos e alertas (C2.4) ---

export interface Favorite {
  jobId: string;
  jobTitle: string;
  companyName: string;
  savedAt: string;
}

/** Alerta de novas vagas por critério simples (palavra-chave e/ou área). */
export interface JobAlert {
  id: string;
  keyword?: string;
  area?: string;
  createdAt: string;
}

// --- Denúncias (C3) ---

export type ReportTargetType = "JOB" | "COMPANY" | "USER";

export type ReportReason =
  | "DISCRIMINATION"
  | "FALSE_INFO"
  | "INACCESSIBLE"
  | "SPAM"
  | "OTHER";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  DISCRIMINATION: "Conteúdo discriminatório ou capacitista",
  FALSE_INFO: "Informação falsa ou enganosa",
  INACCESSIBLE: "Processo ou conteúdo inacessível",
  SPAM: "Spam ou golpe",
  OTHER: "Outro motivo",
};

export type ReportStatus = "PENDING" | "REVIEWED" | "ARCHIVED";

/** Notificação ao candidato (ex.: mudança de status de candidatura — E3.2). */
export interface Notification {
  type: "APPLICATION_STATUS";
  applicationId: string;
  jobTitle: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  reporterId: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: string;
}

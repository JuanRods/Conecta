/**
 * Tipos de domínio de Vagas (Fase 3).
 * Alinhados ao modelo de dados do design (.kiro/specs/conecta-inclusao/design.md):
 *   Job(id, companyId, title, description, modality, level, area,
 *       accessibilityFeatures[], status, createdAt, publishedAt)
 */

/** Modalidade de trabalho. */
export type Modality = "REMOTE" | "HYBRID" | "ONSITE";

/** Nível de senioridade. */
export type Level = "JUNIOR" | "MID" | "SENIOR";

/**
 * Recursos de acessibilidade oferecidos pela vaga/empresa.
 * Usado tanto nos selos da vaga quanto no filtro de inclusividade (P2.1, P2.2).
 */
export type AccessibilityFeature =
  | "SCREEN_READER" // compatível com leitor de tela
  | "SIGN_LANGUAGE" // intérprete/atendimento em Libras
  | "WHEELCHAIR_ACCESS" // acesso físico para cadeirantes
  | "FLEXIBLE_HOURS" // jornada/horário flexível
  | "ASSISTIVE_TECH" // tecnologia assistiva disponível
  | "INCLUSIVE_ONBOARDING"; // integração inclusiva

/**
 * Ciclo de vida da vaga. A busca pública expõe apenas APPROVED (P2.2, M1).
 */
export type JobStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PAUSED"
  | "CLOSED";

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Rascunho",
  PENDING: "Em moderação",
  APPROVED: "Publicada",
  REJECTED: "Rejeitada",
  PAUSED: "Pausada",
  CLOSED: "Encerrada",
};

export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description: string;
  location: string;
  modality: Modality;
  level: Level;
  area: string;
  accessibilityFeatures: AccessibilityFeature[];
  status: JobStatus;
  createdAt: string;
  publishedAt?: string;
}

/**
 * Filtros da busca pública. Todos opcionais — ausência significa "qualquer".
 * `features` usa semântica "contém todos" (vaga precisa oferecer todos os
 * recursos marcados).
 */
export interface JobFilters {
  keyword?: string;
  location?: string;
  modality?: Modality;
  level?: Level;
  area?: string;
  features?: AccessibilityFeature[];
}

// --- Rótulos legíveis (pt-BR) para UI e leitores de tela ---

export const MODALITY_LABELS: Record<Modality, string> = {
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
  ONSITE: "Presencial",
};

export const LEVEL_LABELS: Record<Level, string> = {
  JUNIOR: "Júnior",
  MID: "Pleno",
  SENIOR: "Sênior",
};

export const FEATURE_LABELS: Record<AccessibilityFeature, string> = {
  SCREEN_READER: "Compatível com leitor de tela",
  SIGN_LANGUAGE: "Atendimento em Libras",
  WHEELCHAIR_ACCESS: "Acesso para cadeirantes",
  FLEXIBLE_HOURS: "Horário flexível",
  ASSISTIVE_TECH: "Tecnologia assistiva",
  INCLUSIVE_ONBOARDING: "Integração inclusiva",
};

/** Ícone textual (emoji) usado nos selos — sempre acompanhado de rótulo. */
export const FEATURE_ICONS: Record<AccessibilityFeature, string> = {
  SCREEN_READER: "🔊",
  SIGN_LANGUAGE: "🤟",
  WHEELCHAIR_ACCESS: "♿",
  FLEXIBLE_HOURS: "🕒",
  ASSISTIVE_TECH: "🖥️",
  INCLUSIVE_ONBOARDING: "🤝",
};

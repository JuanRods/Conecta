/**
 * Tipos de domínio das Campanhas / Ações das empresas.
 *
 * Uma Campanha é um "card amplo" que divulga uma campanha ou ação inclusiva de
 * uma empresa (contratação afirmativa, mutirão, compromisso de acessibilidade…).
 * Fluxo de publicação: a empresa cria (PENDING) e o administrador aprova
 * (APPROVED) ou recusa (REJECTED). Só as APPROVED aparecem na vitrine pública
 * "Para empresas".
 */

export type CampaignStatus = "PENDING" | "APPROVED" | "REJECTED";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  PENDING: "Em moderação",
  APPROVED: "Publicada",
  REJECTED: "Recusada",
};

/** Modificador do elemento `.badge` para cada status. */
export const CAMPAIGN_STATUS_BADGE: Record<
  CampaignStatus,
  "success" | "warning" | "error"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export interface Campaign {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  subtitle: string;
  description: string;
  callToAction: string;
  link?: string;
  tag: string;
  status: CampaignStatus;
  reviewReason?: string;
  createdAt: string;
  publishedAt?: string;
}

/** Dados para criar uma campanha (o status é definido pelo servidor). */
export interface CreateCampaignInput {
  companyId: string;
  title: string;
  subtitle: string;
  description: string;
  callToAction: string;
  link?: string;
  tag: string;
}

/** Sugestões de categoria para o card (rótulo exibido como "selo"). */
export const CAMPAIGN_TAGS = [
  "Contratação afirmativa",
  "Ação comunitária",
  "Compromisso",
  "Educação",
  "Evento",
] as const;

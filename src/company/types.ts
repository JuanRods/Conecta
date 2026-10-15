import type { AccessibilityFeature } from "../jobs/types";

/**
 * Tipos de domínio do Perfil Empresa (Fase 5).
 * Alinhados ao modelo de dados do design (.kiro/specs/conecta-inclusao/design.md):
 *   Company(userId, name, cnpj, sector, inclusionPolicy,
 *       accessibilityFeatures[], verificationStatus)
 */

/** Status de verificação da empresa pelo administrador (E1.3 / M1). */
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  PENDING: "Pendente de verificação",
  VERIFIED: "Empresa verificada",
  REJECTED: "Verificação recusada",
};

export interface Company {
  userId: string;
  name: string;
  cnpj: string;
  sector: string;
  description: string;
  /** Política/compromissos de inclusão (E1.1). */
  inclusionPolicy: string;
  /** Recursos de acessibilidade oferecidos no ambiente de trabalho (E1.2). */
  accessibilityFeatures: AccessibilityFeature[];
  website?: string;
  verificationStatus: VerificationStatus;
  updatedAt: string;
}

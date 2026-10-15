import type { Company } from "./types";
import { apiRequest } from "../api/client";

/**
 * Serviço de perfil da empresa — conversa com o backend real
 * (GET/PUT /companies/me, GET /companies/pending, PATCH /companies/:id/verification).
 *
 * A empresa dona é inferida pelo token; o `userId` recebido em `get`/`exists`
 * é mantido na assinatura para compatibilidade com os componentes.
 */

export const companyService = {
  async get(_userId: string): Promise<Company> {
    return apiRequest<Company>("/companies/me");
  },

  async exists(_userId: string): Promise<boolean> {
    const { exists } = await apiRequest<{ exists: boolean }>(
      "/companies/me/exists",
    );
    return exists;
  },

  async save(company: Company): Promise<Company> {
    return apiRequest<Company>("/companies/me", { method: "PUT", body: company });
  },

  // --- Verificação pela MODERAÇÃO (Fase 6 — E1.3 / M1) ---

  async listPendingVerification(): Promise<Company[]> {
    return apiRequest<Company[]>("/companies/pending");
  },

  async setVerification(
    userId: string,
    status: Company["verificationStatus"],
  ): Promise<Company> {
    return apiRequest<Company>(`/companies/${userId}/verification`, {
      method: "PATCH",
      body: { status },
    });
  },
};

/** Normaliza/valida CNPJ no formato 00.000.000/0000-00 (14 dígitos). */
export function isValidCnpj(cnpj: string): boolean {
  return /^\d{14}$/.test(cnpj.replace(/\D/g, ""));
}

export function formatCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

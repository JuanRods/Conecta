import type { Company } from "./types";

/**
 * Serviço de perfil da empresa (Fase 5 — E1).
 *
 * NOTA DE AMBIENTE: MOCK em localStorage (sandbox sem backend). Interface pronta
 * para um cliente HTTP real.
 *
 * E1.3: ao cadastrar, a empresa entra como "pendente de verificação"
 * (`verificationStatus: PENDING`) até a aprovação do administrador (Fase 6).
 */

const COMPANIES_KEY = "conecta.companies";

function loadAll(): Company[] {
  try {
    return JSON.parse(localStorage.getItem(COMPANIES_KEY) ?? "[]") as Company[];
  } catch {
    return [];
  }
}

function saveAll(companies: Company[]) {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

function emptyCompany(userId: string): Company {
  return {
    userId,
    name: "",
    cnpj: "",
    sector: "",
    description: "",
    inclusionPolicy: "",
    accessibilityFeatures: [],
    website: "",
    verificationStatus: "PENDING",
    updatedAt: new Date().toISOString(),
  };
}

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

export const companyService = {
  async get(userId: string): Promise<Company> {
    const found = loadAll().find((c) => c.userId === userId);
    return simulateLatency(found ?? emptyCompany(userId));
  },

  async exists(userId: string): Promise<boolean> {
    return simulateLatency(loadAll().some((c) => c.userId === userId));
  },

  /**
   * Cria/atualiza o perfil. Uma empresa recém-criada fica PENDING; edições
   * mantêm o status atual (a reverificação após mudança sensível fica a cargo
   * da moderação, Fase 6).
   */
  async save(company: Company): Promise<Company> {
    const all = loadAll();
    const existing = all.find((c) => c.userId === company.userId);
    const next: Company = {
      ...company,
      verificationStatus:
        existing?.verificationStatus ?? company.verificationStatus ?? "PENDING",
      updatedAt: new Date().toISOString(),
    };
    saveAll([...all.filter((c) => c.userId !== company.userId), next]);
    return simulateLatency(next);
  },

  // --- Verificação pela MODERAÇÃO (Fase 6 — E1.3 / M1) ---

  /** Empresas aguardando verificação. */
  async listPendingVerification(): Promise<Company[]> {
    return simulateLatency(
      loadAll().filter((c) => c.verificationStatus === "PENDING"),
    );
  },

  /** Define o status de verificação (verificar/recusar). */
  async setVerification(
    userId: string,
    status: Company["verificationStatus"],
  ): Promise<Company> {
    const all = loadAll();
    const idx = all.findIndex((c) => c.userId === userId);
    if (idx === -1) throw new Error("Empresa não encontrada.");
    all[idx] = {
      ...all[idx],
      verificationStatus: status,
      updatedAt: new Date().toISOString(),
    };
    saveAll(all);
    return simulateLatency(all[idx]);
  },
};

import type { Campaign, CampaignStatus, CreateCampaignInput } from "./types";
import { api, apiEnabled } from "../api/client";

/**
 * Serviço de Campanhas / Ações das empresas.
 *
 * NOTA DE AMBIENTE: igual aos demais serviços, quando a API real está ativa
 * (`VITE_API_URL` definido) fala com o PostgreSQL via endpoints REST; sem ela,
 * persiste em localStorage com um catálogo semente, para a demonstração offline.
 *
 * Regra de negócio (espelhada no backend): campanhas nascem PENDING e só
 * aparecem na vitrine pública quando o administrador as aprova (APPROVED).
 */

const CAMPAIGNS_KEY = "conecta.campaigns";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `camp-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function resolveNow<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// --- Catálogo semente (apenas no modo offline) ---
const SEED: Campaign[] = [
  {
    id: "seed-camp-1",
    companyId: "seed-techinclui",
    companyName: "TechInclui",
    title: "Programa Talentos sem Barreiras",
    subtitle: "TechInclui · Contratação afirmativa de pessoas com deficiência",
    description:
      "Abrimos 20 vagas afirmativas em tecnologia com trilha de mentoria, " +
      "acessibilidade digital garantida (WCAG 2.1 AA) e horário flexível. Todo " +
      "o processo seletivo oferece intérprete de Libras, materiais em alto " +
      "contraste e tempo adicional mediante solicitação.",
    callToAction: "Quero participar do programa",
    link: "https://techinclui.com.br/talentos",
    tag: "Contratação afirmativa",
    status: "APPROVED",
    createdAt: "2026-10-08T12:00:00.000Z",
    publishedAt: "2026-10-09T12:00:00.000Z",
  },
  {
    id: "seed-camp-2",
    companyId: "seed-cuidarbem",
    companyName: "CuidarBem Saúde",
    title: "Mutirão de Saúde Acessível",
    subtitle: "CuidarBem Saúde · Ação comunitária",
    description:
      "Durante todo o mês, nossas unidades oferecem atendimento gratuito com " +
      "acessibilidade plena: rampas, intérpretes de Libras e profissionais " +
      "capacitados em comunicação inclusiva. Uma ação para aproximar o cuidado " +
      "de quem mais precisa.",
    callToAction: "Agendar atendimento",
    link: "https://cuidarbem.com.br/mutirao",
    tag: "Ação comunitária",
    status: "APPROVED",
    createdAt: "2026-10-11T12:00:00.000Z",
    publishedAt: "2026-10-12T12:00:00.000Z",
  },
  {
    id: "seed-camp-3",
    companyId: "seed-logaccess",
    companyName: "LogAccess",
    title: "Centros de Distribuição 100% Acessíveis",
    subtitle: "LogAccess · Compromisso de acessibilidade",
    description:
      "Concluímos a adaptação de todos os nossos centros de distribuição: " +
      "acesso para cadeirantes, estações de trabalho ajustáveis e sinalização " +
      "inclusiva. Conheça a transformação e venha fazer parte do nosso time.",
    callToAction: "Conhecer a iniciativa",
    tag: "Compromisso",
    status: "APPROVED",
    createdAt: "2026-10-14T12:00:00.000Z",
    publishedAt: "2026-10-15T12:00:00.000Z",
  },
];

function loadAll(): Campaign[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    if (raw) return JSON.parse(raw) as Campaign[];
  } catch {
    /* cai no seed abaixo */
  }
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(SEED));
  return SEED;
}

function saveAll(list: Campaign[]) {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
}

function byNewest(list: Campaign[]): Campaign[] {
  return [...list].sort((a, b) =>
    (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
  );
}

export const campaignService = {
  /** Vitrine pública: somente campanhas APPROVED. */
  async listApproved(): Promise<Campaign[]> {
    if (apiEnabled()) return api.get<Campaign[]>("/campaigns");
    return resolveNow(byNewest(loadAll().filter((c) => c.status === "APPROVED")));
  },

  /** Campanhas de uma empresa (qualquer status), mais recentes primeiro. */
  async listByCompany(companyId: string): Promise<Campaign[]> {
    if (apiEnabled()) {
      return api.get<Campaign[]>(`/companies/${companyId}/campaigns`);
    }
    const list = loadAll()
      .filter((c) => c.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return resolveNow(list);
  },

  /** Campanhas aguardando moderação (admin). */
  async listPending(): Promise<Campaign[]> {
    if (apiEnabled()) {
      const queue = await api.get<{ campaigns: Campaign[] }>(
        "/admin/moderation/queue",
      );
      return queue.campaigns ?? [];
    }
    const list = loadAll()
      .filter((c) => c.status === "PENDING")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return resolveNow(list);
  },

  /** Cria uma campanha (nasce PENDING). */
  async create(
    input: CreateCampaignInput,
    companyName: string,
  ): Promise<Campaign> {
    if (apiEnabled()) return api.post<Campaign>("/campaigns", input);
    const all = loadAll();
    const campaign: Campaign = {
      id: makeId(),
      companyId: input.companyId,
      companyName,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      description: input.description.trim(),
      callToAction: input.callToAction.trim(),
      link: input.link?.trim() || undefined,
      tag: input.tag,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    all.push(campaign);
    saveAll(all);
    return resolveNow(campaign);
  },

  /** Remove a própria campanha (empresa). */
  async remove(id: string, companyId: string): Promise<void> {
    if (apiEnabled()) {
      await api.del(`/campaigns/${id}?companyId=${encodeURIComponent(companyId)}`);
      return;
    }
    saveAll(loadAll().filter((c) => !(c.id === id && c.companyId === companyId)));
    await resolveNow(null);
  },

  /** Moderação: aprova a campanha, publicando-a. */
  async approve(
    admin: { id: string; name: string },
    id: string,
  ): Promise<Campaign> {
    if (apiEnabled()) {
      return api.patch<Campaign>(`/admin/campaigns/${id}/review`, {
        action: "approve",
        adminId: admin.id,
        adminName: admin.name,
      });
    }
    return updateLocalStatus(id, "APPROVED");
  },

  /** Moderação: recusa a campanha, registrando o motivo. */
  async reject(
    admin: { id: string; name: string },
    id: string,
    reason: string,
  ): Promise<Campaign> {
    if (apiEnabled()) {
      return api.patch<Campaign>(`/admin/campaigns/${id}/review`, {
        action: "reject",
        reason,
        adminId: admin.id,
        adminName: admin.name,
      });
    }
    return updateLocalStatus(id, "REJECTED", reason);
  },
};

function updateLocalStatus(
  id: string,
  status: CampaignStatus,
  reason?: string,
): Promise<Campaign> {
  const all = loadAll();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Campanha não encontrada.");
  all[idx] = {
    ...all[idx],
    status,
    reviewReason: status === "REJECTED" ? reason : undefined,
    publishedAt:
      status === "APPROVED" ? new Date().toISOString() : all[idx].publishedAt,
  };
  saveAll(all);
  return resolveNow(all[idx]);
}

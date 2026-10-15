import { useAuth } from "../auth/AuthContext";

const ROLE_LABEL: Record<string, string> = {
  CANDIDATE: "Candidato",
  COMPANY: "Empresa",
  ADMIN: "Administrador",
};

const NEXT_PHASE: Record<string, string> = {
  CANDIDATE: "Perfil, candidaturas e favoritos (Fase 4).",
  COMPANY: "Fase 5 — Perfil da empresa e gestão de vagas.",
  ADMIN: "Fase 6 — Fila de moderação, denúncias e métricas.",
};

/**
 * Painel inicial pós-login. O conteúdo específico de cada perfil será
 * construído nas próximas fases; aqui confirmamos a sessão e o RBAC.
 */
export function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section aria-labelledby="painel-title" style={{ paddingBlock: "2rem" }}>
      <h1 id="painel-title">Olá, {user.name}</h1>
      <p>
        Você está no painel de <strong>{ROLE_LABEL[user.role]}</strong>.
      </p>
      <p style={{ color: "var(--color-fg-muted)" }}>
        Próximos recursos deste painel: {NEXT_PHASE[user.role]}
      </p>
    </section>
  );
}

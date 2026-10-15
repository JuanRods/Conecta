import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./candidate.css";

/**
 * Painel do candidato (Fase 4). Casca com navegação secundária acessível
 * (perfil, candidaturas, favoritos/alertas) e área de conteúdo via <Outlet>.
 */
export function CandidateDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="dashboard" aria-labelledby="cand-title">
      <header className="dashboard__head">
        <h1 id="cand-title">Painel do candidato</h1>
        <p className="dashboard__lead">
          Olá, {user.name}. Gerencie sua procura por emprego.
        </p>
      </header>

      <nav
        className="dashboard__nav"
        aria-label="Seções do painel do candidato"
      >
        <NavLink end to="/painel">
          Visão geral
        </NavLink>
        <NavLink to="/painel/perfil">Meu perfil</NavLink>
        <NavLink to="/painel/candidaturas">Minhas candidaturas</NavLink>
        <NavLink to="/painel/favoritos">Favoritos e alertas</NavLink>
      </nav>

      <div>
        <Outlet />
      </div>
    </section>
  );
}

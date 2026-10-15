import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./company.css";

/**
 * Painel da empresa (Fase 5). Casca com navegação secundária acessível
 * (perfil e vagas) e área de conteúdo via <Outlet>.
 */
export function CompanyDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="comp" aria-labelledby="comp-title">
      <header className="comp__head">
        <h1 id="comp-title">Painel da empresa</h1>
        <p className="comp__lead">
          Olá, {user.name}. Gerencie seu perfil e suas vagas inclusivas.
        </p>
      </header>

      <nav className="comp__nav" aria-label="Seções do painel da empresa">
        <NavLink end to="/empresa">
          Visão geral
        </NavLink>
        <NavLink to="/empresa/perfil">Perfil da empresa</NavLink>
        <NavLink to="/empresa/vagas">Minhas vagas</NavLink>
      </nav>

      <div className="comp__content">
        <Outlet />
      </div>
    </section>
  );
}

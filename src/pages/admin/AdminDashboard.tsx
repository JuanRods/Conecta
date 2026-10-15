import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./admin.css";

/**
 * Painel do administrador (Fase 6). Casca com navegação secundária acessível.
 * Reutiliza os elementos de design compartilhados (.dashboard em
 * src/styles/elements/dashboard.css).
 */
export function AdminDashboard() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="dashboard" aria-labelledby="admin-title">
      <header className="dashboard__head">
        <h1 id="admin-title">Painel do administrador</h1>
        <p className="dashboard__lead">
          Olá, {user.name}. Modere conteúdos, verifique empresas e acompanhe as
          métricas.
        </p>
      </header>

      <nav className="dashboard__nav" aria-label="Seções do painel de moderação">
        <NavLink end to="/admin">
          Visão geral
        </NavLink>
        <NavLink to="/admin/moderacao">Fila de moderação</NavLink>
        <NavLink to="/admin/denuncias">Denúncias</NavLink>
        <NavLink to="/admin/contas">Contas</NavLink>
        <NavLink to="/admin/auditoria">Auditoria</NavLink>
        <NavLink to="/admin/metricas">Métricas</NavLink>
      </nav>

      <div>
        <Outlet />
      </div>
    </section>
  );
}

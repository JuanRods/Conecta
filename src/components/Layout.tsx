import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { AccessibilityControls } from "./AccessibilityControls";
import { Button } from "./Button";
import { useAuth, dashboardPathForRole } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { VLibras } from "../accessibility/VLibras";
import { TourLauncher } from "../accessibility/TourLauncher";
import "./Layout.css";

/**
 * Estrutura global com marcos semânticos (A1) e skip link (A2).
 * header > nav / main / footer. A navegação reflete o estado de autenticação.
 */
export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    announce("Você saiu da sua conta.");
    navigate("/");
  }

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Link
            to="/"
            className="site-header__brand"
            aria-label="Conecta Inclusão — página inicial"
          >
            <Logo />
          </Link>

          <nav aria-label="Navegação principal" className="site-nav">
            {isAuthenticated && user ? (
              <>
                <NavLink to="/vagas">Vagas</NavLink>
                <NavLink to="/para-empresas">Para empresas</NavLink>
                <NavLink to={dashboardPathForRole(user.role)}>
                  Meu painel
                </NavLink>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="site-nav__logout"
                >
                  Sair
                </Button>
              </>
            ) : (
              <NavLink to="/entrar">Entrar</NavLink>
            )}
          </nav>
        </div>
        <div className="site-header__a11y">
          <div className="container">
            <AccessibilityControls />
          </div>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1}>
        <div className="container">
          <Outlet />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            <strong>Conecta Inclusão</strong> — Oportunidades que transformam
            realidades.
          </p>
          <p className="site-footer__note">
            Plataforma acessível conforme WCAG 2.1 AA. Dúvidas de
            acessibilidade? Fale conosco.
          </p>
        </div>
      </footer>

      {/* Ícone global da Navegação Guiada (A5) — presente em todas as telas */}
      <TourLauncher />

      {/* Widget de tradução para Libras (NF6) */}
      <VLibras />
    </>
  );
}

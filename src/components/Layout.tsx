import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "./Logo";
import { AccessibilityControls } from "./AccessibilityControls";
import "./Layout.css";

/**
 * Estrutura global com marcos semânticos (A1) e skip link (A2).
 * header > nav / main / footer.
 */
export function Layout() {
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
            <NavLink to="/vagas">Vagas</NavLink>
            <NavLink to="/para-empresas">Para empresas</NavLink>
            <NavLink to="/entrar">Entrar</NavLink>
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
    </>
  );
}

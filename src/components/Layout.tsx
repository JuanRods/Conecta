import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { AccessibilityMenu } from "./AccessibilityMenu";
import { Button } from "./Button";
import { useAuth, dashboardPathForRole } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { VLibras } from "../accessibility/VLibras";
import { TourLauncher } from "../accessibility/TourLauncher";
import "./Layout.css";

/** Ícones decorativos (aria-hidden) usados nos itens de navegação. */
function IconInicio() {
  return (
    <svg
      className="site-nav__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M12 3 3 10v11h6v-6h6v6h6V10l-9-7Zm0 2.5 7 5.5v8h-2v-6H7v6H5v-8l7-5.5Z"
      />
    </svg>
  );
}

function IconVagas() {
  return (
    <svg
      className="site-nav__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M10 4h4a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2Zm4 3V6h-4v1h4ZM5 9v9h14V9H5Z"
      />
    </svg>
  );
}

function IconEmpresas() {
  return (
    <svg
      className="site-nav__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4h3a2 2 0 0 1 2 2v10H4Zm2-2h7V5H6v14Zm9 0h4v-8h-4v8ZM8 7h3v2H8V7Zm0 4h3v2H8v-2Zm0 4h3v2H8v-2Z"
      />
    </svg>
  );
}

function IconPainel() {
  return (
    <svg
      className="site-nav__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M3 3h8v8H3V3Zm0 10h8v8H3v-8ZM13 3h8v8h-8V3Zm0 10h8v8h-8v-8Z"
      />
    </svg>
  );
}

function IconEntrar() {
  return (
    <svg
      className="site-nav__icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M11 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-7 18a7 7 0 0 1 14 0v1H4v-1Zm18-9h-3v-2h3V8l4 3-4 3v-2Z"
      />
    </svg>
  );
}

/**
 * Estrutura global com marcos semânticos (A1) e skip link (A2).
 * header > nav / main / footer. A navegação reflete o estado de autenticação.
 *
 * O topo adota um layout no estilo LinkedIn: marca à esquerda, campo de busca,
 * navegação principal com ícone + rótulo e indicador de item ativo, e a área
 * do usuário (avatar + sair) à direita. As preferências de acessibilidade
 * (tema, contraste e fonte) ficam reunidas no menu flutuante AccessibilityMenu,
 * sempre disponível em qualquer tela.
 */
export function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");

  function handleLogout() {
    logout();
    announce("Você saiu da sua conta.");
    navigate("/");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const termo = busca.trim();
    navigate(termo ? `/vagas?q=${encodeURIComponent(termo)}` : "/vagas");
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
            <Logo compact />
          </Link>

          <form
            role="search"
            className="site-search"
            onSubmit={handleSearch}
          >
            <label htmlFor="busca-vagas" className="sr-only">
              Buscar vagas
            </label>
            <span className="site-search__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                <path
                  fill="currentColor"
                  d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm8.32 12.9 3.39 3.39-1.42 1.42-3.39-3.39 1.42-1.42Z"
                />
              </svg>
            </span>
            <input
              id="busca-vagas"
              type="search"
              name="q"
              className="site-search__input"
              placeholder="Buscar vagas"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button type="submit" className="site-search__submit">
              Buscar
            </button>
          </form>

          <nav aria-label="Navegação principal" className="site-nav">
            {isAuthenticated && user ? (
              <>
                <NavLink to="/feed" className="site-nav__item">
                  <IconInicio />
                  <span className="site-nav__label">Início</span>
                </NavLink>
                <NavLink to="/vagas" className="site-nav__item">
                  <IconVagas />
                  <span className="site-nav__label">Vagas</span>
                </NavLink>
                <NavLink to="/para-empresas" className="site-nav__item">
                  <IconEmpresas />
                  <span className="site-nav__label">Para empresas</span>
                </NavLink>
                <NavLink
                  to={dashboardPathForRole(user.role)}
                  className="site-nav__item"
                >
                  <IconPainel />
                  <span className="site-nav__label">Meu painel</span>
                </NavLink>
                <div className="site-user">
                  <Avatar name={user.name} size="sm" decorative />
                  <span className="site-user__name" aria-hidden="true">
                    {user.name}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="site-nav__logout"
                  >
                    Sair
                  </Button>
                </div>
              </>
            ) : (
              <NavLink to="/entrar" className="site-nav__item">
                <IconEntrar />
                <span className="site-nav__label">Entrar</span>
              </NavLink>
            )}
          </nav>
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

      {/* Menu único de acessibilidade (A4, A6): reúne tema, contraste e fonte
          num só lugar, sempre acessível por botão flutuante. */}
      <AccessibilityMenu />

      {/* Ícone global da Navegação Guiada (A5) — presente em todas as telas */}
      <TourLauncher />

      {/* Widget de tradução para Libras (NF6) */}
      <VLibras />
    </>
  );
}

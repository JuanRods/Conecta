import { useEffect, useId, useRef, useState } from "react";
import { usePreferences } from "../accessibility/PreferencesContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { useFocusTrap } from "../accessibility/useFocusTrap";
import "./AccessibilityMenu.css";

/**
 * Menu único de Acessibilidade (A4, A6).
 *
 * Reúne TODAS as preferências de apresentação em um só lugar, acionado por um
 * botão flutuante sempre disponível:
 *   - Tema claro/escuro
 *   - Alto contraste
 *   - Tamanho da fonte (diminuir / padrão / aumentar)
 *
 * Substitui os ícones soltos que antes ficavam espalhados na barra do cabeçalho.
 *
 * Acessibilidade:
 *   - O botão usa aria-expanded/aria-controls para anunciar o estado do painel.
 *   - O painel é um diálogo não-modal com foco preso (Tab circula) e Esc fecha.
 *   - Clique fora fecha o painel; o foco volta ao botão.
 *   - Cada ação é anunciada em região aria-live (Announcer).
 *
 * NOTA: não há alternância manual de "reduzir animações" — a redução de
 * movimento é aplicada automaticamente quando o sistema sinaliza
 * `prefers-reduced-motion: reduce` (A6).
 */
export function AccessibilityMenu() {
  const {
    theme,
    contrast,
    fontScale,
    toggleTheme,
    toggleContrast,
    increaseFont,
    decreaseFont,
    resetFont,
  } = usePreferences();
  const { announce } = useAnnouncer();

  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  useFocusTrap(panelRef, open, close);

  // Clique fora do painel (e do botão) fecha o menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pct = Math.round(fontScale * 100);

  return (
    <div className="a11y-menu">
      <button
        ref={buttonRef}
        type="button"
        className="a11y-menu__fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Abrir menu de acessibilidade"
        title="Acessibilidade"
      >
        <span className="a11y-menu__fab-icon" aria-hidden="true">
          ♿
        </span>
        <span className="a11y-menu__fab-text">Acessibilidade</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          className="a11y-menu__panel"
          role="dialog"
          aria-modal="false"
          aria-label="Preferências de acessibilidade"
        >
          <div className="a11y-menu__header">
            <h2 className="a11y-menu__title">Acessibilidade</h2>
            <button
              type="button"
              className="a11y-menu__close"
              onClick={close}
              aria-label="Fechar menu de acessibilidade"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {/* --- Tema claro/escuro e contraste --- */}
          <section
            className="a11y-menu__group"
            aria-labelledby={`${panelId}-tema`}
          >
            <h3 id={`${panelId}-tema`} className="a11y-menu__group-title">
              Aparência
            </h3>
            <button
              type="button"
              className="a11y-menu__option"
              onClick={() => {
                toggleTheme();
                announce(
                  `Tema ${theme === "light" ? "escuro" : "claro"} ativado`,
                );
              }}
              aria-pressed={theme === "dark"}
            >
              <span className="a11y-menu__option-icon" aria-hidden="true">
                {theme === "light" ? "🌙" : "☀️"}
              </span>
              <span className="a11y-menu__option-label">
                {theme === "light" ? "Modo escuro" : "Modo claro"}
              </span>
              <span className="a11y-menu__state" aria-hidden="true">
                {theme === "dark" ? "Escuro" : "Claro"}
              </span>
            </button>

            <button
              type="button"
              className="a11y-menu__option"
              onClick={() => {
                toggleContrast();
                announce(
                  `Alto contraste ${
                    contrast === "high" ? "desativado" : "ativado"
                  }`,
                );
              }}
              aria-pressed={contrast === "high"}
            >
              <span className="a11y-menu__option-icon" aria-hidden="true">
                ◐
              </span>
              <span className="a11y-menu__option-label">Alto contraste</span>
              <span className="a11y-menu__state" aria-hidden="true">
                {contrast === "high" ? "Ativo" : "Inativo"}
              </span>
            </button>
          </section>

          {/* --- Tamanho da fonte --- */}
          <section
            className="a11y-menu__group"
            aria-labelledby={`${panelId}-fonte`}
          >
            <h3 id={`${panelId}-fonte`} className="a11y-menu__group-title">
              Tamanho da fonte
            </h3>
            <div
              className="a11y-menu__font"
              role="group"
              aria-label="Ajustar tamanho da fonte"
            >
              <button
                type="button"
                className="a11y-menu__font-btn"
                onClick={() => {
                  decreaseFont();
                  announce("Fonte reduzida");
                }}
                aria-label="Diminuir tamanho da fonte"
              >
                A−
              </button>
              <button
                type="button"
                className="a11y-menu__font-btn a11y-menu__font-btn--reset"
                onClick={() => {
                  resetFont();
                  announce("Tamanho da fonte padrão");
                }}
                aria-label="Restaurar tamanho padrão da fonte"
              >
                <span aria-hidden="true">{pct}%</span>
              </button>
              <button
                type="button"
                className="a11y-menu__font-btn"
                onClick={() => {
                  increaseFont();
                  announce("Fonte ampliada");
                }}
                aria-label="Aumentar tamanho da fonte"
              >
                A+
              </button>
            </div>
            <p className="a11y-menu__hint">
              Toque em <strong>{pct}%</strong> para voltar ao padrão.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

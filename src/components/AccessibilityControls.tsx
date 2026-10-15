import { usePreferences } from "../accessibility/PreferencesContext";
import { useAnnouncer } from "../accessibility/Announcer";
import "./AccessibilityControls.css";

/**
 * Barra de controles de acessibilidade (A4, A6):
 * tema claro/escuro, alto contraste, tamanho de fonte e redução de movimento.
 * Cada ação é anunciada por leitor de tela.
 */
export function AccessibilityControls() {
  const {
    theme,
    contrast,
    fontScale,
    reducedMotion,
    toggleTheme,
    toggleContrast,
    increaseFont,
    decreaseFont,
    resetFont,
    toggleReducedMotion,
  } = usePreferences();
  const { announce } = useAnnouncer();

  return (
    <div
      className="a11y-controls"
      role="group"
      aria-label="Preferências de acessibilidade"
    >
      <button
        type="button"
        className="a11y-controls__btn"
        onClick={() => {
          toggleTheme();
          announce(`Tema ${theme === "light" ? "escuro" : "claro"} ativado`);
        }}
        aria-pressed={theme === "dark"}
      >
        <span aria-hidden="true">{theme === "light" ? "🌙" : "☀️"}</span>
        <span>{theme === "light" ? "Modo escuro" : "Modo claro"}</span>
      </button>

      <button
        type="button"
        className="a11y-controls__btn"
        onClick={() => {
          toggleContrast();
          announce(
            `Alto contraste ${contrast === "high" ? "desativado" : "ativado"}`,
          );
        }}
        aria-pressed={contrast === "high"}
      >
        <span aria-hidden="true">◐</span>
        <span>Alto contraste</span>
      </button>

      <div
        className="a11y-controls__group"
        role="group"
        aria-label="Tamanho da fonte"
      >
        <button
          type="button"
          className="a11y-controls__btn a11y-controls__btn--icon"
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
          className="a11y-controls__btn a11y-controls__btn--icon"
          onClick={() => {
            resetFont();
            announce("Tamanho da fonte padrão");
          }}
          aria-label="Restaurar tamanho padrão da fonte"
        >
          <span aria-hidden="true">{Math.round(fontScale * 100)}%</span>
        </button>
        <button
          type="button"
          className="a11y-controls__btn a11y-controls__btn--icon"
          onClick={() => {
            increaseFont();
            announce("Fonte ampliada");
          }}
          aria-label="Aumentar tamanho da fonte"
        >
          A+
        </button>
      </div>

      <button
        type="button"
        className="a11y-controls__btn"
        onClick={() => {
          toggleReducedMotion();
          announce(`Animações ${reducedMotion ? "ativadas" : "reduzidas"}`);
        }}
        aria-pressed={reducedMotion}
      >
        <span aria-hidden="true">⏯</span>
        <span>Reduzir animações</span>
      </button>
    </div>
  );
}

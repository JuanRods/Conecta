import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco do teclado dentro de um container (A2.3).
 * - Move o foco para o primeiro elemento focável ao ativar.
 * - Faz o Tab/Shift+Tab circular dentro do container.
 * - Chama onEscape ao pressionar Esc.
 * - Devolve o foco ao elemento de origem ao desativar.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );

    // Foca o primeiro elemento ao abrir
    const focusables = getFocusable();
    (focusables[0] ?? container).focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== "Tab") return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // devolve o foco ao elemento de origem
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onEscape]);
}

import { useState } from "react";
import { useGuidedTour, type TourStep } from "./GuidedTour";
import "./GuidedTourLauncher.css";

/**
 * Lançador flutuante da Navegação Guiada (A5).
 *
 * Mostra um ícone fixo no canto com uma mensagem ("Navegação guiada") ao lado.
 * A mensagem aparece ao passar o mouse (hover) ou ao focar pelo teclado e
 * desaparece gradualmente (fade-out via CSS) quando o mouse sai do ícone —
 * exatamente o comportamento pedido. O estado é controlado por eventos de
 * mouse/foco e, no CSS, por uma transição de opacidade.
 *
 * Ao ativar, inicia uma navegação guiada contextual da página atual.
 */

/** Passos padrão de boas-vindas, caso a página não forneça os seus. */
const DEFAULT_STEPS: TourStep[] = [
  {
    title: "Navegação guiada",
    description:
      "Esta navegação mostra os principais recursos da página. Use os botões " +
      "Próximo e Anterior, ou pressione Esc para sair.",
  },
  {
    target: ".a11y-controls",
    title: "Personalize sua experiência",
    description:
      "Aqui você alterna tema claro/escuro, ativa alto contraste, muda o " +
      "tamanho da fonte e reduz animações.",
  },
];

export function GuidedTourLauncher({
  tourId = "guia-pagina",
  steps = DEFAULT_STEPS,
  label = "Navegação guiada",
}: {
  tourId?: string;
  steps?: TourStep[];
  label?: string;
}) {
  const { startTour } = useGuidedTour();
  // `hovered` controla a visibilidade da mensagem. Ao sair do mouse, vira false
  // e o CSS faz o fade-out (transição de opacidade).
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="tour-launcher"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="tour-launcher__btn"
        aria-label={`Iniciar ${label.toLowerCase()}`}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => startTour({ id: tourId, steps })}
      >
        <span aria-hidden="true" className="tour-launcher__icon">
          🧭
        </span>
      </button>
      <span
        className={`tour-launcher__message${
          hovered ? " tour-launcher__message--visible" : ""
        }`}
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}

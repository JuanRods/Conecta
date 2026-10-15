import {
  FEATURE_ICONS,
  FEATURE_LABELS,
  type AccessibilityFeature,
} from "./types";
import "./AccessibilityBadges.css";

/**
 * Selos de acessibilidade de uma vaga (P2, design §5.4).
 * Cada selo tem rótulo textual visível; o ícone é decorativo (aria-hidden),
 * garantindo que leitores de tela anunciem apenas o texto significativo.
 */
export function AccessibilityBadges({
  features,
  label = "Recursos de acessibilidade oferecidos",
}: {
  features: AccessibilityFeature[];
  label?: string;
}) {
  if (features.length === 0) return null;

  return (
    <ul className="a11y-badges" aria-label={label}>
      {features.map((f) => (
        <li key={f} className="a11y-badge">
          <span className="a11y-badge__icon" aria-hidden="true">
            {FEATURE_ICONS[f]}
          </span>
          <span className="a11y-badge__text">{FEATURE_LABELS[f]}</span>
        </li>
      ))}
    </ul>
  );
}

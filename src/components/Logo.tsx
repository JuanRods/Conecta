import "./Logo.css";

/**
 * Logo "Conecta Inclusão": três figuras entrelaçadas (roxo, teal, laranja).
 * SVG decorativo com rótulo textual acessível ao lado.
 *
 * `compact` reduz a marca para uso na barra de topo (estilo LinkedIn),
 * mantendo o mesmo rótulo acessível "Conecta Inclusão".
 */
export function Logo({ compact = false }: { compact?: boolean } = {}) {
  const classes = ["logo", compact ? "logo--compact" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <svg
        className="logo__mark"
        viewBox="0 0 120 60"
        width="48"
        height="24"
        role="img"
        aria-label="Conecta Inclusão"
        focusable="false"
      >
        <circle cx="24" cy="18" r="9" fill="#5B2A86" />
        <circle
          cx="24"
          cy="42"
          r="14"
          fill="none"
          stroke="#5B2A86"
          strokeWidth="6"
        />
        <circle cx="60" cy="16" r="9" fill="#2E8B9E" />
        <circle
          cx="60"
          cy="40"
          r="14"
          fill="none"
          stroke="#2E8B9E"
          strokeWidth="6"
        />
        <circle cx="96" cy="18" r="9" fill="#E8862E" />
        <circle
          cx="96"
          cy="42"
          r="14"
          fill="none"
          stroke="#E8862E"
          strokeWidth="6"
        />
      </svg>
      <span className="logo__text" aria-hidden="true">
        <strong>Conecta</strong> Inclusão
      </span>
    </span>
  );
}

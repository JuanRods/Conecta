import { useEffect, useRef } from "react";

/**
 * Integração do VLibras (NF6 / A4): widget oficial do governo que traduz o
 * conteúdo para Libras (Língua Brasileira de Sinais).
 *
 * Carrega o script uma única vez e inicializa o plugin. A estrutura DOM
 * (`.vw-plugin-wrapper`) é a exigida pelo VLibras. Os controles do widget são
 * acessíveis por teclado. Caso o script não carregue (ex.: offline), a página
 * segue funcionando normalmente.
 */

const VLIBRAS_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

export function VLibras() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    function start() {
      try {
        if (window.VLibras) {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
        }
      } catch {
        /* widget indisponível — a aplicação continua acessível sem ele */
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${VLIBRAS_SRC}"]`,
    );
    if (existing) {
      start();
      return;
    }

    const script = document.createElement("script");
    script.src = VLIBRAS_SRC;
    script.async = true;
    script.onload = start;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      className="enabled vw-plugin-wrapper"
      role="region"
      aria-label="Tradução para Libras (VLibras)"
    >
      <div className="vw-access-button active" />
      <div className="vw-plugin-top-wrapper" />
    </div>
  );
}

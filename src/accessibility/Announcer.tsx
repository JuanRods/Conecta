import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

/**
 * Região aria-live global para anunciar mudanças dinâmicas a leitores de tela
 * (A3.1): resultados de busca, confirmações, mudanças de estado.
 */

type Politeness = "polite" | "assertive";

interface AnnouncerContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMsg, setPoliteMsg] = useState("");
  const [assertiveMsg, setAssertiveMsg] = useState("");
  const clearTimer = useRef<number | undefined>(undefined);

  const announce = useCallback(
    (message: string, politeness: Politeness = "polite") => {
      const setter =
        politeness === "assertive" ? setAssertiveMsg : setPoliteMsg;
      // Limpa e reescreve para garantir que o leitor re-anuncie mensagens iguais
      setter("");
      window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => setter(message), 50);
    },
    [],
  );

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMsg}
      </div>
      <div
        className="sr-only"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMsg}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer(): AnnouncerContextValue {
  const ctx = useContext(AnnouncerContext);
  if (!ctx) {
    throw new Error("useAnnouncer deve ser usado dentro de AnnouncerProvider");
  }
  return ctx;
}

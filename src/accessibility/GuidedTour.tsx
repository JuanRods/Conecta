import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFocusTrap } from "./useFocusTrap";
import { useAnnouncer } from "./Announcer";
import "./GuidedTour.css";

/**
 * Navegação Guiada (A5): conduz o usuário passo a passo por um fluxo.
 * - Totalmente operável por teclado (Anterior/Próximo/Pular/Fechar + Esc).
 * - Foco preso no painel; cada passo é anunciado por leitor de tela.
 * - Destaca o elemento-alvo (via seletor CSS) respeitando reduced-motion.
 * - Marca o tour como concluído em localStorage para não repetir.
 */

export interface TourStep {
  /** Seletor do elemento a destacar. Omita para um passo centralizado. */
  target?: string;
  title: string;
  description: string;
}

interface Tour {
  id: string;
  steps: TourStep[];
}

interface GuidedTourContextValue {
  startTour: (tour: Tour) => void;
  isTourCompleted: (id: string) => boolean;
  /** Marca um tour para nunca mais ser oferecido automaticamente. */
  suppressTour: (id: string) => void;
  /** Indica se o usuário pediu para não exibir novamente este tour. */
  isTourSuppressed: (id: string) => boolean;
}

const COMPLETED_KEY = "conecta.tours.completed";
const SUPPRESSED_KEY = "conecta.tours.suppressed";

const GuidedTourContext = createContext<GuidedTourContextValue | null>(null);

function loadList(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function addToList(key: string, id: string) {
  try {
    const set = new Set(loadList(key));
    set.add(id);
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignora */
  }
}

function loadCompleted(): string[] {
  return loadList(COMPLETED_KEY);
}

function markCompleted(id: string) {
  addToList(COMPLETED_KEY, id);
}

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const { announce } = useAnnouncer();

  const close = useCallback(() => {
    setTour(null);
    setIndex(0);
  }, []);

  const finish = useCallback(() => {
    if (tour) markCompleted(tour.id);
    announce("Navegação guiada concluída");
    close();
  }, [tour, announce, close]);

  const startTour = useCallback(
    (t: Tour) => {
      setTour(t);
      setIndex(0);
      announce(`Navegação guiada iniciada: ${t.steps.length} passos`);
    },
    [announce],
  );

  const isTourCompleted = useCallback(
    (id: string) => loadCompleted().includes(id),
    [],
  );

  const suppressTour = useCallback(
    (id: string) => addToList(SUPPRESSED_KEY, id),
    [],
  );

  const isTourSuppressed = useCallback(
    (id: string) => loadList(SUPPRESSED_KEY).includes(id),
    [],
  );

  const active = tour !== null;
  useFocusTrap(panelRef, active, close);

  const step = tour?.steps[index];

  // Destaca o elemento-alvo do passo atual
  useEffect(() => {
    if (!active || !step?.target) return;
    const el = document.querySelector<HTMLElement>(step.target);
    if (!el) return;
    el.classList.add("tour-highlight");
    // scrollIntoView não existe em alguns ambientes (ex.: jsdom nos testes).
    el.scrollIntoView?.({ block: "center", behavior: "auto" });
    return () => el.classList.remove("tour-highlight");
  }, [active, step]);

  // Anuncia cada passo
  useEffect(() => {
    if (active && step) {
      announce(`Passo ${index + 1}: ${step.title}. ${step.description}`);
    }
  }, [active, index, step, announce]);

  if (!active || !tour || !step) {
    return (
      <GuidedTourContext.Provider value={{ startTour, isTourCompleted, suppressTour, isTourSuppressed }}>
        {children}
      </GuidedTourContext.Provider>
    );
  }

  const isLast = index === tour.steps.length - 1;
  const isFirst = index === 0;

  return (
    <GuidedTourContext.Provider value={{ startTour, isTourCompleted, suppressTour, isTourSuppressed }}>
      {children}
      <div className="tour__backdrop" />
      <div
        ref={panelRef}
        className="tour__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-desc"
      >
        <p className="tour__progress">
          Passo {index + 1} de {tour.steps.length}
        </p>
        <h2 id="tour-title" className="tour__title">
          {step.title}
        </h2>
        <p id="tour-desc" className="tour__desc">
          {step.description}
        </p>
        <div className="tour__actions">
          <button
            type="button"
            className="tour__btn tour__btn--text"
            onClick={finish}
          >
            Pular guia
          </button>
          <div className="tour__nav">
            <button
              type="button"
              className="tour__btn"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={isFirst}
            >
              Anterior
            </button>
            {isLast ? (
              <button
                type="button"
                className="tour__btn tour__btn--primary"
                onClick={finish}
              >
                Concluir
              </button>
            ) : (
              <button
                type="button"
                className="tour__btn tour__btn--primary"
                onClick={() =>
                  setIndex((i) => Math.min(tour.steps.length - 1, i + 1))
                }
              >
                Próximo
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          className="tour__close"
          onClick={close}
          aria-label="Fechar navegação guiada"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTour(): GuidedTourContextValue {
  const ctx = useContext(GuidedTourContext);
  if (!ctx) {
    throw new Error(
      "useGuidedTour deve ser usado dentro de GuidedTourProvider",
    );
  }
  return ctx;
}

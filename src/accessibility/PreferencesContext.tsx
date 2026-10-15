import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Gerencia as preferências de acessibilidade e apresentação do usuário:
 * tema (A4), alto contraste e escala de fonte (A6), redução de movimento (A6).
 * As escolhas são persistidas em localStorage e refletidas em atributos no <html>.
 */

export type Theme = "light" | "dark";
export type Contrast = "normal" | "high";

interface Preferences {
  theme: Theme;
  contrast: Contrast;
  fontScale: number; // 1 = 100%
  reducedMotion: boolean;
}

interface PreferencesContextValue extends Preferences {
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleContrast: () => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  resetFont: () => void;
  toggleReducedMotion: () => void;
}

const STORAGE_KEY = "conecta.prefs";
const FONT_MIN = 0.85;
const FONT_MAX = 2; // até 200% (A6)
const FONT_STEP = 0.15;

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getSystemTheme(): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadStored(): Partial<Preferences> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Preferences>) : {};
  } catch {
    return {};
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const stored = loadStored();

  const [theme, setThemeState] = useState<Theme>(
    stored.theme ?? getSystemTheme(),
  );
  const [contrast, setContrast] = useState<Contrast>(
    stored.contrast ?? "normal",
  );
  const [fontScale, setFontScale] = useState<number>(stored.fontScale ?? 1);
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    stored.reducedMotion ?? getSystemReducedMotion(),
  );

  // Aplica as preferências ao documento e persiste
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-contrast", contrast === "high" ? "high" : "normal");
    root.setAttribute("data-reduced-motion", String(reducedMotion));
    root.style.setProperty("--font-scale", String(fontScale));

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, contrast, fontScale, reducedMotion }),
      );
    } catch {
      /* armazenamento indisponível — segue sem persistir */
    }
  }, [theme, contrast, fontScale, reducedMotion]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      contrast,
      fontScale,
      reducedMotion,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((t) => (t === "light" ? "dark" : "light")),
      toggleContrast: () =>
        setContrast((c) => (c === "high" ? "normal" : "high")),
      increaseFont: () =>
        setFontScale((s) => Math.min(FONT_MAX, +(s + FONT_STEP).toFixed(2))),
      decreaseFont: () =>
        setFontScale((s) => Math.max(FONT_MIN, +(s - FONT_STEP).toFixed(2))),
      resetFont: () => setFontScale(1),
      toggleReducedMotion: () => setReducedMotion((m) => !m),
    }),
    [theme, contrast, fontScale, reducedMotion],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error(
      "usePreferences deve ser usado dentro de PreferencesProvider",
    );
  }
  return ctx;
}

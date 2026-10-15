import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

// Habilita o matcher de acessibilidade axe nos testes (Fase 1.6 / NF1)
expect.extend(toHaveNoViolations);

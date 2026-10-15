/**
 * Augmentação dos tipos do Vitest com o matcher `toHaveNoViolations` do
 * jest-axe (habilitado em src/test/setup.ts via expect.extend).
 *
 * O `import "vitest"` abaixo torna este arquivo um módulo, de modo que o
 * `declare module "vitest"` AUMENTA os tipos existentes em vez de substituí-los.
 */
import "vitest";

interface AxeMatchers<R = unknown> {
  toHaveNoViolations(): R;
}

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion<T = unknown> extends AxeMatchers<T> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

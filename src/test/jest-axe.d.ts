/**
 * Declaração de tipo ambiente para `jest-axe` (que não publica tipos próprios),
 * usada nos testes de acessibilidade (NF1). Mantém `tsc -b` / `npm run build`
 * passando sem adicionar dependências.
 *
 * NOTA: este arquivo NÃO deve conter `import`/`export` de nível superior, para
 * que `declare module` permaneça ambiente (global).
 */

declare module "jest-axe" {
  export interface AxeResults {
    violations: unknown[];
  }
  export function axe(
    html: Element | string,
    options?: unknown,
  ): Promise<AxeResults>;
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): {
      pass: boolean;
      message(): string;
    };
  };
}

/**
 * Política de senha forte (P1.2). As regras são expostas em texto para que a UI
 * possa apresentá-las de forma acessível e sinalizar quais foram atendidas.
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: "Pelo menos 8 caracteres",
    test: (v) => v.length >= 8,
  },
  {
    id: "letter",
    label: "Pelo menos uma letra",
    test: (v) => /[a-zA-ZÀ-ÿ]/.test(v),
  },
  {
    id: "number",
    label: "Pelo menos um número",
    test: (v) => /\d/.test(v),
  },
  {
    id: "symbol",
    label: "Pelo menos um símbolo (ex.: ! @ # $)",
    test: (v) => /[^a-zA-ZÀ-ÿ0-9]/.test(v),
  },
];

export function isStrongPassword(value: string): boolean {
  return passwordRules.every((r) => r.test(value));
}

export function unmetRules(value: string): PasswordRule[] {
  return passwordRules.filter((r) => !r.test(value));
}

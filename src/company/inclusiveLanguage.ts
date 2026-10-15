/**
 * Assistente de descrição inclusiva (E2.2).
 *
 * Verifica a linguagem de uma descrição de vaga e sugere alternativas mais
 * inclusivas. A lista é didática/local (sem IA externa) e pode ser expandida.
 * O objetivo é ORIENTAR, não bloquear: as sugestões são avisos, não erros.
 */

export interface LanguageFinding {
  /** Termo encontrado (como aparece no texto, em minúsculas). */
  term: string;
  /** Por que evitar e o que usar no lugar. */
  suggestion: string;
}

interface Rule {
  /** Regex (sem flags; aplicamos "gi"). Use \b para limites de palavra. */
  pattern: RegExp;
  label: string;
  suggestion: string;
}

const RULES: Rule[] = [
  {
    pattern: /\bportador(?:es|a|as)?\s+de\s+defici[êe]ncia\b/i,
    label: "portador de deficiência",
    suggestion:
      'Prefira "pessoa com deficiência (PcD)". A deficiência não é algo que se "porta".',
  },
  {
    pattern: /\bdeficiente(s)?\b/i,
    label: "deficiente",
    suggestion:
      'Prefira "pessoa com deficiência (PcD)", colocando a pessoa em primeiro lugar.',
  },
  {
    pattern: /\bnormais?\b/i,
    label: "normal / pessoas normais",
    suggestion:
      'Evite opor PcD a "pessoas normais". Use "pessoas sem deficiência", se necessário.',
  },
  {
    pattern: /\bespeciais?\b/i,
    label: "especial / necessidades especiais",
    suggestion:
      'Prefira "pessoa com deficiência" ou cite a necessidade específica de acessibilidade.',
  },
  {
    pattern: /\b(aleijad[oa]s?|coxo|manco)\b/i,
    label: "termo capacitista sobre mobilidade",
    suggestion:
      'Evite termos pejorativos. Use "pessoa com deficiência física", se for pertinente.',
  },
  {
    pattern: /\b(surdo-?mud[oa]s?)\b/i,
    label: "surdo-mudo",
    suggestion:
      'Prefira "pessoa surda". "Surdo-mudo" é impreciso e considerado ofensivo.',
  },
  {
    pattern: /\bretardad[oa]s?\b/i,
    label: "retardado",
    suggestion:
      'Prefira "pessoa com deficiência intelectual". O termo é pejorativo.',
  },
  {
    pattern: /\bcadeirante\s+preso\b|\bpreso\s+(?:a|à)\s+cadeira\b/i,
    label: "preso à cadeira de rodas",
    suggestion:
      'Prefira "pessoa usuária de cadeira de rodas". A cadeira dá autonomia, não aprisiona.',
  },
];

/** Dicas gerais para uma descrição de vaga inclusiva. */
export const INCLUSIVE_TIPS: string[] = [
  "Descreva as atividades essenciais da vaga de forma objetiva.",
  "Liste as acomodações e recursos de acessibilidade que a empresa oferece.",
  'Use "pessoa com deficiência (PcD)" — pessoa sempre em primeiro lugar.',
  "Evite exigências físicas que não sejam realmente essenciais à função.",
  "Informe como o candidato pode solicitar acomodações no processo seletivo.",
];

/** Analisa o texto e retorna os termos a revisar (vazio = tudo certo). */
export function analyzeDescription(text: string): LanguageFinding[] {
  const findings: LanguageFinding[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    const re = new RegExp(rule.pattern.source, "gi");
    const match = re.exec(text);
    if (match && !seen.has(rule.label)) {
      seen.add(rule.label);
      findings.push({ term: rule.label, suggestion: rule.suggestion });
    }
  }
  return findings;
}

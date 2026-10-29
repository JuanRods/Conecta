/**
 * Assistência auditiva por SÍNTESE DE VOZ (Web Speech API).
 *
 * É o equivalente sonoro do VLibras: em vez de traduzir para Libras, lê o texto
 * em voz alta (pt-BR) usando o recurso nativo do navegador `speechSynthesis` —
 * sem plugins nem dependências externas. Útil para pessoas com baixa visão,
 * dislexia ou quem simplesmente prefere ouvir as instruções.
 *
 * Degradação graciosa: se o navegador não tiver suporte, as funções viram
 * no-ops e `isSpeechSupported()` retorna false (a UI esconde o controle).
 */

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

/** Interrompe qualquer leitura em andamento. */
export function cancelSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignora: síntese indisponível */
  }
}

/** Seleciona a melhor voz em português disponível, se houver. */
function pickPortugueseVoice(): SpeechSynthesisVoice | undefined {
  try {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => /pt[-_]br/i.test(v.lang)) ??
      voices.find((v) => /^pt/i.test(v.lang))
    );
  } catch {
    return undefined;
  }
}

/**
 * Lê um texto em voz alta (pt-BR). Cancela a fala anterior antes de começar,
 * para não sobrepor mensagens. `onEnd` é chamado ao terminar ou em erro.
 */
export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSupported() || !text.trim()) {
    onEnd?.();
    return;
  }
  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "pt-BR";
    utter.rate = 1;
    utter.pitch = 1;

    const voice = pickPortugueseVoice();
    if (voice) utter.voice = voice;

    if (onEnd) {
      utter.onend = onEnd;
      utter.onerror = onEnd;
    }
    synth.speak(utter);
  } catch {
    onEnd?.();
  }
}

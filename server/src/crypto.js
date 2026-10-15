import crypto from "node:crypto";

/**
 * Criptografia autenticada (AES-256-GCM) para o bloco sensível do candidato
 * (tipo de deficiência e acomodações) — LGPD / NF2: dados sensíveis
 * criptografados em repouso. A chave vem de CONECTA_SENSITIVE_KEY; se ausente,
 * derivamos uma chave de desenvolvimento estável (NÃO use em produção).
 */

const RAW_KEY =
  process.env.CONECTA_SENSITIVE_KEY ||
  "dev-only-sensitive-key-change-me-in-production";

// Deriva uma chave de 32 bytes determinística a partir do segredo.
const KEY = crypto.createHash("sha256").update(RAW_KEY).digest();

export function encryptSensitive(obj) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Formato: gcm:<iv>:<tag>:<ciphertext> (tudo em base64)
  return `gcm:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSensitive(payload) {
  const empty = { accommodations: [] };
  if (!payload || !payload.startsWith("gcm:")) return empty;
  try {
    const [, ivB64, tagB64, dataB64] = payload.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    const parsed = JSON.parse(dec.toString("utf8"));
    return { ...parsed, accommodations: parsed.accommodations ?? [] };
  } catch {
    return empty;
  }
}

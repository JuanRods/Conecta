/// <reference types="vite/client" />

/**
 * Variáveis de ambiente do frontend (prefixo obrigatório `VITE_`).
 *
 * VITE_API_URL — URL base da API (ex.: http://localhost:3001). Quando ausente,
 * os serviços usam o armazenamento local (demonstração offline e testes).
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

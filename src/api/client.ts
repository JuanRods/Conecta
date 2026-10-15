/**
 * Cliente HTTP único do frontend.
 *
 * Centraliza a base URL da API, o envio do token JWT (Bearer) e o tratamento de
 * erros. Os serviços de domínio (auth, jobs, candidate, company, admin, privacy)
 * usam este cliente, mantendo exatamente os mesmos contratos públicos que antes
 * eram atendidos pelos mocks em localStorage — por isso os componentes não mudam.
 *
 * A base vem de VITE_API_URL (ver .env.example); por padrão aponta para o
 * backend local em http://localhost:4000.
 */

function baseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  const fromGlobal =
    typeof globalThis !== "undefined"
      ? (globalThis as { __CONECTA_API_URL__?: string }).__CONECTA_API_URL__
      : undefined;
  return (fromGlobal ?? fromEnv ?? "http://localhost:4000").replace(/\/$/, "");
}

const TOKEN_KEY = "conecta.auth.token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignora indisponibilidade de storage */
  }
}

/** Erro de API com código estável e status HTTP para a UI tratar. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Quando true, não envia o token mesmo que exista (rotas públicas). */
  anonymous?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, anonymous = false } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = anonymous ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "NETWORK", "Não foi possível conectar ao servidor.");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    const code = (data as { code?: string })?.code;
    const message =
      (data as { error?: string })?.error ?? `Erro ${res.status}.`;
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Monta uma querystring ignorando valores vazios/undefined. */
export function toQuery(
  params: Record<string, string | string[] | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) sp.set(key, value.join(","));
    } else if (value !== "") {
      sp.set(key, value);
    }
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

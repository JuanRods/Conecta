/**
 * Cliente HTTP da API do Conecta Inclusão.
 *
 * ESTRATÉGIA DE INTEGRAÇÃO (adaptador):
 * Os serviços do frontend (`jobService`, `authService`, …) consultam
 * `apiEnabled()`. Quando `VITE_API_URL` está definida, eles falam com a API
 * real (PostgreSQL); quando não está, caem no armazenamento local usado nos
 * testes e na demonstração offline. Assim a troca de backend não altera
 * nenhum componente de UI.
 *
 * Configure em `.env.local`:
 *   VITE_API_URL=http://localhost:3001
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

/** Indica se a API real está configurada. */
export function apiEnabled(): boolean {
  return BASE_URL.length > 0;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body as { error?: { code: string; message: string } } | null)
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "UNKNOWN",
      err?.message ?? `Falha na requisição (${res.status}).`,
    );
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Monta a query string da busca pública de vagas. */
export function jobSearchQuery(filters: {
  keyword?: string;
  location?: string;
  modality?: string;
  level?: string;
  area?: string;
  features?: string[];
}): string {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.location) params.set("local", filters.location);
  if (filters.modality) params.set("modalidade", filters.modality);
  if (filters.level) params.set("nivel", filters.level);
  if (filters.area) params.set("area", filters.area);
  filters.features?.forEach((f) => params.append("feature", f));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

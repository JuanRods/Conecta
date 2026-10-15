import {
  AuthError,
  type LoginInput,
  type RegisterInput,
  type User,
  type UserStatus,
} from "./types";
import { apiRequest, ApiError, setToken, getToken } from "../api/client";

/**
 * Serviço de autenticação — agora conversa com o backend real
 * (POST /auth/register, /auth/login, /auth/forgot-password, GET /auth/me).
 *
 * A sessão (token + usuário) é mantida em localStorage para que `getSession()`
 * permaneça síncrono (o AuthContext o lê na inicialização). O token é anexado
 * automaticamente pelo cliente HTTP a cada requisição autenticada.
 */

export interface Session {
  token: string;
  user: User;
}

const SESSION_KEY = "conecta.auth.session";

interface ApiSession {
  token: string;
  user: User;
}

function persist(session: Session) {
  setToken(session.token);
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignora */
  }
}

/** Converte um ApiError em AuthError com código estável para a UI. */
function toAuthError(err: unknown): AuthError {
  if (err instanceof ApiError) {
    const code = err.code;
    if (
      code === "EMAIL_IN_USE" ||
      code === "INVALID_CREDENTIALS" ||
      code === "ACCOUNT_SUSPENDED" ||
      code === "NOT_FOUND" ||
      code === "WEAK_PASSWORD"
    ) {
      return new AuthError(code, err.message);
    }
    return new AuthError("INVALID_CREDENTIALS", err.message);
  }
  return new AuthError("INVALID_CREDENTIALS", "Falha de autenticação.");
}

export const authService = {
  async register(input: RegisterInput): Promise<Session> {
    try {
      const session = await apiRequest<ApiSession>("/auth/register", {
        method: "POST",
        anonymous: true,
        body: input,
      });
      persist(session);
      return session;
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async login(input: LoginInput): Promise<Session> {
    try {
      const session = await apiRequest<ApiSession>("/auth/login", {
        method: "POST",
        anonymous: true,
        body: input,
      });
      persist(session);
      return session;
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    // Resposta neutra: nunca revela se o e-mail existe (boa prática de segurança).
    await apiRequest<void>("/auth/forgot-password", {
      method: "POST",
      anonymous: true,
      body: { email },
    }).catch(() => undefined);
  },

  logout(): void {
    setToken(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignora */
    }
  },

  getSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      // Mantém o token do cliente em sincronia com a sessão persistida.
      if (session.token && !getToken()) setToken(session.token);
      return session;
    } catch {
      return null;
    }
  },

  // --- Administração de contas (Fase 6 — M2) ---

  async listUsers(): Promise<User[]> {
    return apiRequest<User[]>("/auth/users");
  },

  async setUserStatus(userId: string, status: UserStatus): Promise<User> {
    try {
      return await apiRequest<User>(`/auth/users/${userId}/status`, {
        method: "PATCH",
        body: { status },
      });
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async deleteUser(userId: string): Promise<void> {
    await apiRequest<void>(`/auth/users/${userId}`, { method: "DELETE" });
    const current = this.getSession();
    if (current?.user.id === userId) this.logout();
  },
};

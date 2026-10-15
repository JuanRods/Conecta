import {
  AuthError,
  type LoginInput,
  type RegisterInput,
  type Role,
  type User,
  type UserStatus,
} from "./types";
import { isStrongPassword } from "./passwordPolicy";

/**
 * Serviço de autenticação.
 *
 * NOTA DE AMBIENTE: o sandbox está em modo INTEGRATIONS_ONLY (sem backend),
 * então esta é uma implementação MOCK que persiste em localStorage e simula
 * os endpoints descritos no design (POST /auth/register, /auth/login,
 * /auth/forgot-password). A interface pública (AuthService) foi desenhada para
 * ser substituída por um cliente HTTP real sem alterar os consumidores.
 */

export interface Session {
  token: string;
  user: User;
}

const USERS_KEY = "conecta.auth.users";
const SESSION_KEY = "conecta.auth.session";

interface StoredUser extends User {
  passwordHash: string;
}

// --- Persistência (simulando o banco) ---

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Hash didático — NÃO é seguro. No backend real, usar argon2 (ver design).
function fakeHash(password: string): string {
  return `hashed:${btoa(unescape(encodeURIComponent(password)))}`;
}

function stripPassword(u: StoredUser): User {
  const { passwordHash: _ignored, ...user } = u;
  return user;
}

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function simulateLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 300));
}

// --- Seed: garante um administrador para testar a moderação (Fase 6) ---

function ensureSeed() {
  const users = loadUsers();
  if (!users.some((u) => u.role === "ADMIN")) {
    users.push({
      id: makeId(),
      name: "Administração Conecta",
      email: "admin@conectainclusao.org",
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      passwordHash: fakeHash("Admin@123"),
    });
    saveUsers(users);
  }
}

// --- API pública ---

export const authService = {
  async register(input: RegisterInput): Promise<Session> {
    ensureSeed();
    const email = input.email.trim().toLowerCase();

    if (!isStrongPassword(input.password)) {
      throw new AuthError(
        "WEAK_PASSWORD",
        "A senha não atende aos requisitos de segurança.",
      );
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      throw new AuthError(
        "EMAIL_IN_USE",
        "Já existe uma conta com este e-mail.",
      );
    }

    const role: Role =
      input.accountType === "company" ? "COMPANY" : "CANDIDATE";
    const stored: StoredUser = {
      id: makeId(),
      name: input.name.trim(),
      email,
      role,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      passwordHash: fakeHash(input.password),
    };
    users.push(stored);
    saveUsers(users);

    const session: Session = {
      token: `mock-${stored.id}`,
      user: stripPassword(stored),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return simulateLatency(session);
  },

  async login(input: LoginInput): Promise<Session> {
    ensureSeed();
    const email = input.email.trim().toLowerCase();
    const users = loadUsers();
    const found = users.find((u) => u.email === email);

    if (!found || found.passwordHash !== fakeHash(input.password)) {
      throw new AuthError("INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    }
    if (found.status === "SUSPENDED") {
      throw new AuthError(
        "ACCOUNT_SUSPENDED",
        "Esta conta está suspensa. Fale com o suporte.",
      );
    }

    const session: Session = {
      token: `mock-${found.id}`,
      user: stripPassword(found),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return simulateLatency(session);
  },

  async forgotPassword(email: string): Promise<void> {
    // Resposta neutra: nunca revela se o e-mail existe (boa prática de segurança).
    await simulateLatency(email);
  },

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },

  // --- Administração de contas (Fase 6 — M2) ---

  /** Lista todas as contas (sem o hash de senha). */
  async listUsers(): Promise<User[]> {
    ensureSeed();
    return simulateLatency(loadUsers().map(stripPassword));
  },

  /**
   * Suspende ou reativa uma conta (M2.5). Contas suspensas têm o login
   * bloqueado em `login()`.
   */
  async setUserStatus(userId: string, status: UserStatus): Promise<User> {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new AuthError("NOT_FOUND", "Conta não encontrada.");
    users[idx] = { ...users[idx], status };
    saveUsers(users);
    return simulateLatency(stripPassword(users[idx]));
  },

  /**
   * Remove a conta e encerra a sessão (direito à exclusão — LGPD/NF2).
   * A remoção dos dados associados é orquestrada pelo privacyService.
   */
  async deleteUser(userId: string): Promise<void> {
    saveUsers(loadUsers().filter((u) => u.id !== userId));
    const current = this.getSession();
    if (current?.user.id === userId) this.logout();
    await simulateLatency(null);
  },
};

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService, type Session } from "./authService";
import type { LoginInput, RegisterInput, Role, User } from "./types";

/**
 * Estado global de autenticação e autorização (RBAC).
 * Expõe o usuário atual, ações de login/registro/logout e helpers de permissão.
 */

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() =>
    authService.getSession(),
  );

  const login = useCallback(async (input: LoginInput) => {
    const s = await authService.login(input);
    setSession(s);
    return s.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const s = await authService.register(input);
    setSession(s);
    return s.user;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (session ? roles.includes(session.user.role) : false),
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      register,
      logout,
      hasRole,
    }),
    [session, login, register, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}

/** Caminho do painel de acordo com o papel do usuário. */
export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COMPANY":
      return "/empresa";
    case "CANDIDATE":
    default:
      return "/painel";
  }
}

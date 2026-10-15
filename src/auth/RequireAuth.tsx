import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

/**
 * Guarda de rota (RBAC na UI, P1.5):
 * - Redireciona visitantes não autenticados para o login, preservando o destino.
 * - Bloqueia usuários sem o papel exigido, mostrando aviso acessível.
 */
export function RequireAuth({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/entrar" state={{ from: location.pathname }} replace />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section aria-labelledby="sem-permissao" style={{ paddingBlock: "2rem" }}>
        <h1 id="sem-permissao">Acesso não autorizado</h1>
        <p style={{ color: "var(--color-fg-muted)" }}>
          Seu perfil não tem permissão para acessar esta área.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}

import { Navigate } from "react-router-dom";
import { useAuth, dashboardPathForRole } from "./AuthContext";

/**
 * Rota inicial ("/"): como o acesso agora exige login (todo usuário passa pelo
 * login antes de usar o site), a raiz apenas encaminha:
 *  - autenticado  → painel do seu papel (candidato/empresa/admin);
 *  - visitante    → tela de login.
 */
export function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }
  return <Navigate to="/entrar" replace />;
}

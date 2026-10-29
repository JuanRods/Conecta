import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Rota inicial ("/"): como o acesso agora exige login (todo usuário passa pelo
 * login antes de usar o site), a raiz apenas encaminha:
 *  - autenticado  → feed principal de publicações da comunidade;
 *  - visitante    → tela de login.
 *
 * O painel específico de cada papel continua acessível pelo item "Meu painel"
 * da navegação.
 */
export function RootRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to="/feed" replace />;
  }
  return <Navigate to="/entrar" replace />;
}

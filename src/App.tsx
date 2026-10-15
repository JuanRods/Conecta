import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { RequireAuth } from "./auth/RequireAuth";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },

      // --- Autenticação (Fase 2) ---
      { path: "entrar", element: <LoginPage /> },
      { path: "cadastro", element: <RegisterPage /> },
      { path: "recuperar-senha", element: <ForgotPasswordPage /> },

      // --- Painéis protegidos por papel (RBAC) ---
      {
        path: "painel",
        element: (
          <RequireAuth roles={["CANDIDATE"]}>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "empresa",
        element: (
          <RequireAuth roles={["COMPANY"]}>
            <DashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: "admin",
        element: (
          <RequireAuth roles={["ADMIN"]}>
            <DashboardPage />
          </RequireAuth>
        ),
      },

      // --- Áreas públicas das próximas fases ---
      {
        path: "vagas",
        element: (
          <PlaceholderPage
            title="Vagas"
            phase="Fase 3 — Área pública e busca"
          />
        ),
      },
      {
        path: "para-empresas",
        element: (
          <PlaceholderPage
            title="Para empresas"
            phase="Fase 5 — Perfil empresa"
          />
        ),
      },
      {
        path: "*",
        element: (
          <PlaceholderPage
            title="Página não encontrada"
            phase="Erro 404 — verifique o endereço."
          />
        ),
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}

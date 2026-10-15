import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { JobsPage } from "./pages/JobsPage";
import { JobDetailPage } from "./pages/JobDetailPage";
import { CandidateDashboard } from "./pages/candidate/CandidateDashboard";
import { CandidateOverview } from "./pages/candidate/CandidateOverview";
import { ProfilePage } from "./pages/candidate/ProfilePage";
import { ApplicationsPage } from "./pages/candidate/ApplicationsPage";
import { FavoritesPage } from "./pages/candidate/FavoritesPage";
import { CompanyDashboard } from "./pages/company/CompanyDashboard";
import { CompanyOverview } from "./pages/company/CompanyOverview";
import { CompanyProfilePage } from "./pages/company/CompanyProfilePage";
import { CompanyJobsPage } from "./pages/company/CompanyJobsPage";
import { JobFormPage } from "./pages/company/JobFormPage";
import { JobApplicationsPage } from "./pages/company/JobApplicationsPage";
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
            <CandidateDashboard />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <CandidateOverview /> },
          { path: "perfil", element: <ProfilePage /> },
          { path: "candidaturas", element: <ApplicationsPage /> },
          { path: "favoritos", element: <FavoritesPage /> },
        ],
      },
      {
        path: "empresa",
        element: (
          <RequireAuth roles={["COMPANY"]}>
            <CompanyDashboard />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <CompanyOverview /> },
          { path: "perfil", element: <CompanyProfilePage /> },
          { path: "vagas", element: <CompanyJobsPage /> },
          { path: "vagas/nova", element: <JobFormPage /> },
          { path: "vagas/:id/editar", element: <JobFormPage /> },
          { path: "vagas/:id/candidaturas", element: <JobApplicationsPage /> },
        ],
      },
      {
        path: "admin",
        element: (
          <RequireAuth roles={["ADMIN"]}>
            <DashboardPage />
          </RequireAuth>
        ),
      },

      // --- Área pública: busca e detalhe de vagas (Fase 3) ---
      { path: "vagas", element: <JobsPage /> },
      { path: "vagas/:id", element: <JobDetailPage /> },

      // --- Áreas públicas das próximas fases ---
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

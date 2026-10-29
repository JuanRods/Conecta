import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { RequireAuth } from "./auth/RequireAuth";
import { RootRedirect } from "./auth/RootRedirect";

/**
 * Code-splitting por rota (NF3): as páginas públicas de vagas e os painéis por
 * papel são carregados sob demanda, reduzindo o bundle inicial. Home, login e
 * cadastro ficam no chunk inicial para primeira pintura rápida.
 */
const FeedPage = lazy(() =>
  import("./pages/FeedPage").then((m) => ({ default: m.FeedPage })),
);
const CampaignsPage = lazy(() =>
  import("./pages/CampaignsPage").then((m) => ({ default: m.CampaignsPage })),
);
const JobsPage = lazy(() =>
  import("./pages/JobsPage").then((m) => ({ default: m.JobsPage })),
);
const JobDetailPage = lazy(() =>
  import("./pages/JobDetailPage").then((m) => ({ default: m.JobDetailPage })),
);
const CandidateDashboard = lazy(() =>
  import("./pages/candidate/CandidateDashboard").then((m) => ({
    default: m.CandidateDashboard,
  })),
);
const CandidateOverview = lazy(() =>
  import("./pages/candidate/CandidateOverview").then((m) => ({
    default: m.CandidateOverview,
  })),
);
const ProfilePage = lazy(() =>
  import("./pages/candidate/ProfilePage").then((m) => ({
    default: m.ProfilePage,
  })),
);
const ApplicationsPage = lazy(() =>
  import("./pages/candidate/ApplicationsPage").then((m) => ({
    default: m.ApplicationsPage,
  })),
);
const FavoritesPage = lazy(() =>
  import("./pages/candidate/FavoritesPage").then((m) => ({
    default: m.FavoritesPage,
  })),
);
const PrivacyPage = lazy(() =>
  import("./pages/candidate/PrivacyPage").then((m) => ({
    default: m.PrivacyPage,
  })),
);
const CompanyDashboard = lazy(() =>
  import("./pages/company/CompanyDashboard").then((m) => ({
    default: m.CompanyDashboard,
  })),
);
const CompanyOverview = lazy(() =>
  import("./pages/company/CompanyOverview").then((m) => ({
    default: m.CompanyOverview,
  })),
);
const CompanyProfilePage = lazy(() =>
  import("./pages/company/CompanyProfilePage").then((m) => ({
    default: m.CompanyProfilePage,
  })),
);
const CompanyJobsPage = lazy(() =>
  import("./pages/company/CompanyJobsPage").then((m) => ({
    default: m.CompanyJobsPage,
  })),
);
const CompanyCampaignsPage = lazy(() =>
  import("./pages/company/CompanyCampaignsPage").then((m) => ({
    default: m.CompanyCampaignsPage,
  })),
);
const JobFormPage = lazy(() =>
  import("./pages/company/JobFormPage").then((m) => ({
    default: m.JobFormPage,
  })),
);
const JobApplicationsPage = lazy(() =>
  import("./pages/company/JobApplicationsPage").then((m) => ({
    default: m.JobApplicationsPage,
  })),
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminOverview = lazy(() =>
  import("./pages/admin/AdminOverview").then((m) => ({
    default: m.AdminOverview,
  })),
);
const ModerationQueuePage = lazy(() =>
  import("./pages/admin/ModerationQueuePage").then((m) => ({
    default: m.ModerationQueuePage,
  })),
);
const ReportsPage = lazy(() =>
  import("./pages/admin/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const AccountsPage = lazy(() =>
  import("./pages/admin/AccountsPage").then((m) => ({
    default: m.AccountsPage,
  })),
);
const AuditPage = lazy(() =>
  import("./pages/admin/AuditPage").then((m) => ({ default: m.AuditPage })),
);
const MetricsPage = lazy(() =>
  import("./pages/admin/MetricsPage").then((m) => ({ default: m.MetricsPage })),
);

/** Envolve uma rota preguiçosa com fallback acessível de carregamento. */
function L(node: ReactNode): ReactNode {
  return (
    <Suspense fallback={<p aria-live="polite">Carregando…</p>}>{node}</Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // A raiz exige login: encaminha para o painel (autenticado) ou para a
      // tela de login (visitante). Todo usuário passa pelo login primeiro.
      { index: true, element: <RootRedirect /> },

      // --- Autenticação (Fase 2) — ÚNICAS rotas públicas ---
      { path: "entrar", element: <LoginPage /> },
      { path: "cadastro", element: <RegisterPage /> },
      { path: "recuperar-senha", element: <ForgotPasswordPage /> },

      // --- Painéis protegidos por papel (RBAC) ---
      {
        path: "painel",
        element: (
          <RequireAuth roles={["CANDIDATE"]}>{L(<CandidateDashboard />)}</RequireAuth>
        ),
        children: [
          { index: true, element: L(<CandidateOverview />) },
          { path: "perfil", element: L(<ProfilePage />) },
          { path: "candidaturas", element: L(<ApplicationsPage />) },
          { path: "favoritos", element: L(<FavoritesPage />) },
          { path: "privacidade", element: L(<PrivacyPage />) },
        ],
      },
      {
        path: "empresa",
        element: (
          <RequireAuth roles={["COMPANY"]}>{L(<CompanyDashboard />)}</RequireAuth>
        ),
        children: [
          { index: true, element: L(<CompanyOverview />) },
          { path: "perfil", element: L(<CompanyProfilePage />) },
          { path: "vagas", element: L(<CompanyJobsPage />) },
          { path: "vagas/nova", element: L(<JobFormPage />) },
          { path: "vagas/:id/editar", element: L(<JobFormPage />) },
          { path: "vagas/:id/candidaturas", element: L(<JobApplicationsPage />) },
          { path: "campanhas", element: L(<CompanyCampaignsPage />) },
        ],
      },
      {
        path: "admin",
        element: <RequireAuth roles={["ADMIN"]}>{L(<AdminDashboard />)}</RequireAuth>,
        children: [
          { index: true, element: L(<AdminOverview />) },
          { path: "moderacao", element: L(<ModerationQueuePage />) },
          { path: "denuncias", element: L(<ReportsPage />) },
          { path: "contas", element: L(<AccountsPage />) },
          { path: "auditoria", element: L(<AuditPage />) },
          { path: "metricas", element: L(<MetricsPage />) },
        ],
      },

      // --- Feed principal de publicações (exige login) ---
      {
        path: "feed",
        element: <RequireAuth>{L(<FeedPage />)}</RequireAuth>,
      },

      // --- Busca e detalhe de vagas (agora exige login) ---
      {
        path: "vagas",
        element: <RequireAuth>{L(<JobsPage />)}</RequireAuth>,
      },
      {
        path: "vagas/:id",
        element: <RequireAuth>{L(<JobDetailPage />)}</RequireAuth>,
      },

      // --- Vitrine pública de campanhas das empresas (exige login) ---
      {
        path: "para-empresas",
        element: <RequireAuth>{L(<CampaignsPage />)}</RequireAuth>,
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

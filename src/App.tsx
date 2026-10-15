import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
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
        path: "entrar",
        element: (
          <PlaceholderPage
            title="Entrar"
            phase="Fase 2 — Autenticação e RBAC"
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

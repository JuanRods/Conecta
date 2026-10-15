import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import "./HomePage.css";

/**
 * Página inicial pública. A navegação guiada desta tela está registrada em
 * `accessibility/tours.ts` e é oferecida/reaberta pelo ícone global “Guia”.
 */
export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <section className="hero">
        <h1 className="hero__title">
          Oportunidades que transformam realidades
        </h1>
        <p className="hero__subtitle">
          O Conecta Inclusão aproxima pessoas com deficiência e empresas
          comprometidas com um mercado de trabalho acessível e diverso.
        </p>
        <div className="hero__actions">
          <Button variant="primary" onClick={() => navigate("/vagas")}>
            Buscar vagas
          </Button>
        </div>
      </section>

      <section
        id="busca-vagas"
        className="panel"
        aria-labelledby="busca-titulo"
      >
        <h2 id="busca-titulo">Buscar vagas</h2>
        <p>
          Pesquise oportunidades por palavra-chave, localização, modalidade e
          recursos de acessibilidade. Você não precisa de conta para buscar — o
          login é solicitado apenas no momento da candidatura.
        </p>
        <p>
          <Button variant="primary" onClick={() => navigate("/vagas")}>
            Ir para a busca de vagas
          </Button>
        </p>
      </section>

      <section
        id="cta-empresas"
        className="panel"
        aria-labelledby="empresas-titulo"
      >
        <h2 id="empresas-titulo">Para empresas</h2>
        <p>
          Cadastre vagas inclusivas e encontre talentos. O fluxo de empresas
          será implementado na Fase 5.
        </p>
      </section>
    </>
  );
}

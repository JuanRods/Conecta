import { useGuidedTour } from "../accessibility/GuidedTour";
import { Button } from "../components/Button";
import "./HomePage.css";

/**
 * Página inicial (base). Demonstra a navegação guiada e serve de ponto de
 * partida para a busca pública de vagas (a ser implementada na Fase 3).
 */
export function HomePage() {
  const { startTour } = useGuidedTour();

  function startWelcomeTour() {
    startTour({
      id: "boas-vindas",
      steps: [
        {
          title: "Bem-vindo(a) ao Conecta Inclusão",
          description:
            "Esta navegação guiada mostra os principais recursos. Use os botões Próximo e Anterior, ou pressione Esc para sair.",
        },
        {
          target: ".a11y-controls",
          title: "Personalize sua experiência",
          description:
            "Aqui você alterna entre tema claro e escuro, ativa alto contraste, muda o tamanho da fonte e reduz animações.",
        },
        {
          target: "#busca-vagas",
          title: "Encontre vagas inclusivas",
          description:
            "Use esta área para buscar vagas por palavra-chave, local e recursos de acessibilidade oferecidos.",
        },
        {
          target: "#cta-empresas",
          title: "É uma empresa?",
          description:
            "Empresas podem cadastrar vagas inclusivas e encontrar talentos. Clique aqui para começar.",
        },
      ],
    });
  }

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
          <Button variant="primary" onClick={() => undefined}>
            Buscar vagas
          </Button>
          <Button variant="secondary" onClick={startWelcomeTour}>
            Iniciar navegação guiada
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
          A busca pública de vagas será implementada na Fase 3. Esta área já
          está preparada como marco de navegação acessível.
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

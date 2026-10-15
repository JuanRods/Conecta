import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { AccessibilityBadges } from "../jobs/AccessibilityBadges";
import { jobService } from "../jobs/jobService";
import { LEVEL_LABELS, MODALITY_LABELS, type Job } from "../jobs/types";
import { useAuth } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import "./JobDetailPage.css";

type LoadState =
  | { status: "loading" }
  | { status: "found"; job: Job }
  | { status: "not-found" };

/**
 * Detalhe da vaga (Fase 3 — P2.3, design §5.4).
 * - Mostra descrição completa e selos de acessibilidade.
 * - Login é exigido APENAS ao se candidatar (P2.3): visitantes veem tudo e são
 *   levados ao login (com retorno) só ao clicar em "Candidatar-se".
 */
export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const { isAuthenticated, hasRole } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setState({ status: "not-found" });
      return;
    }
    let active = true;
    setState({ status: "loading" });
    jobService.getById(id).then((job) => {
      if (!active) return;
      if (job) {
        setState({ status: "found", job });
        announce(`Vaga aberta: ${job.title}, na empresa ${job.companyName}.`);
      } else {
        setState({ status: "not-found" });
        announce("Vaga não encontrada ou indisponível.", "assertive");
      }
    });
    return () => {
      active = false;
    };
  }, [id, announce]);

  function handleApply(job: Job) {
    // P2.3: login exigido apenas no momento da candidatura.
    if (isAuthenticated && hasRole("CANDIDATE")) {
      // A candidatura em si é entregue na Fase 4; por ora, levamos ao painel.
      announce("Para concluir, finalize sua candidatura no painel.");
      navigate("/painel");
      return;
    }
    if (isAuthenticated && !hasRole("CANDIDATE")) {
      announce(
        "Apenas contas de candidato podem se candidatar a vagas.",
        "assertive",
      );
      return;
    }
    navigate("/entrar", { state: { from: `/vagas/${job.id}` } });
  }

  if (state.status === "loading") {
    return (
      <section className="job-detail" aria-busy="true">
        <p aria-live="polite">Carregando vaga…</p>
      </section>
    );
  }

  if (state.status === "not-found") {
    return (
      <section className="job-detail" aria-labelledby="nf-title">
        <h1 id="nf-title">Vaga não encontrada</h1>
        <p className="job-detail__muted">
          Esta vaga pode ter sido removida, pausada ou ainda estar em moderação.
        </p>
        <p>
          <Link to="/vagas">← Voltar para a busca de vagas</Link>
        </p>
      </section>
    );
  }

  const { job } = state;
  const onlyCandidateHint =
    isAuthenticated && !hasRole("CANDIDATE")
      ? "Apenas contas de candidato podem se candidatar."
      : undefined;

  return (
    <article className="job-detail" aria-labelledby="job-detail-title">
      <p className="job-detail__back">
        <Link to="/vagas">← Voltar para a busca</Link>
      </p>

      <header className="job-detail__head">
        <h1 id="job-detail-title">{job.title}</h1>
        <p className="job-detail__company">{job.companyName}</p>
        <dl className="job-detail__facts">
          <div>
            <dt>Localização</dt>
            <dd>{job.location}</dd>
          </div>
          <div>
            <dt>Modalidade</dt>
            <dd>{MODALITY_LABELS[job.modality]}</dd>
          </div>
          <div>
            <dt>Nível</dt>
            <dd>{LEVEL_LABELS[job.level]}</dd>
          </div>
          <div>
            <dt>Área</dt>
            <dd>{job.area}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="desc-title" className="job-detail__section">
        <h2 id="desc-title">Descrição</h2>
        <p>{job.description}</p>
      </section>

      <section aria-labelledby="a11y-title" className="job-detail__section">
        <h2 id="a11y-title">Acessibilidade</h2>
        {job.accessibilityFeatures.length > 0 ? (
          <AccessibilityBadges
            features={job.accessibilityFeatures}
            label="Recursos de acessibilidade oferecidos nesta vaga"
          />
        ) : (
          <p className="job-detail__muted">
            A empresa não informou recursos de acessibilidade específicos.
          </p>
        )}
      </section>

      <div className="job-detail__cta">
        <Button variant="primary" onClick={() => handleApply(job)}>
          Candidatar-se a esta vaga
        </Button>
        {!isAuthenticated && (
          <p className="job-detail__muted">
            Você poderá pesquisar sem conta; o login é solicitado apenas para se
            candidatar.
          </p>
        )}
        {onlyCandidateHint && (
          <p className="job-detail__muted" role="note">
            {onlyCandidateHint}
          </p>
        )}
      </div>
    </article>
  );
}

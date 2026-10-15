import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { AccessibilityBadges } from "../jobs/AccessibilityBadges";
import { jobService } from "../jobs/jobService";
import {
  FEATURE_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
  type AccessibilityFeature,
  type Job,
} from "../jobs/types";
import { useAuth } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { applicationService } from "../candidate/applicationService";
import { profileService } from "../candidate/profileService";
import { ReportDialog } from "../candidate/ReportDialog";
import "./JobDetailPage.css";

type LoadState =
  | { status: "loading" }
  | { status: "found"; job: Job }
  | { status: "not-found" };

/**
 * Detalhe da vaga (Fases 3 e 4).
 * - Mostra descrição completa e selos de acessibilidade (Fase 3, P2.3).
 * - Candidatura real para CANDIDATE, com consentimento de compartilhamento de
 *   acomodações (Fase 4 — C2.2 / NF2).
 * - Favoritar vaga (C2.4) e denunciar conteúdo (C3).
 */
export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const { isAuthenticated, hasRole, user } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();

  const isCandidate = isAuthenticated && hasRole("CANDIDATE");

  const [applied, setApplied] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Acomodações do perfil + consentimento para compartilhar.
  const [myAccommodations, setMyAccommodations] = useState<
    AccessibilityFeature[]
  >([]);
  const [shareConsent, setShareConsent] = useState(false);
  const [applying, setApplying] = useState(false);

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

  // Estado específico do candidato: já aplicou? é favorita? quais acomodações?
  useEffect(() => {
    if (!isCandidate || !user || !id) return;
    let active = true;
    Promise.all([
      applicationService.hasApplied(user.id, id),
      applicationService.isFavorite(user.id, id),
      profileService.get(user.id),
    ]).then(([hasApplied, isFav, profile]) => {
      if (!active) return;
      setApplied(hasApplied);
      setFavorite(isFav);
      setMyAccommodations(profile.sensitive.accommodations);
    });
    return () => {
      active = false;
    };
  }, [isCandidate, user, id]);

  function openApply(job: Job) {
    // P2.3: login exigido apenas no momento da candidatura.
    if (!isAuthenticated) {
      navigate("/entrar", { state: { from: `/vagas/${job.id}` } });
      return;
    }
    if (!isCandidate) {
      announce(
        "Apenas contas de candidato podem se candidatar a vagas.",
        "assertive",
      );
      return;
    }
    setShareConsent(false);
    setApplyOpen(true);
  }

  async function confirmApply(job: Job) {
    if (!user) return;
    setApplying(true);
    try {
      const shared =
        shareConsent && myAccommodations.length > 0
          ? myAccommodations
          : undefined;
      await applicationService.apply(
        user.id,
        { id: job.id, title: job.title, companyName: job.companyName },
        shared,
      );
      setApplied(true);
      setApplyOpen(false);
      announce(
        `Candidatura enviada para ${job.title}. Acompanhe o status em “Minhas candidaturas”.`,
      );
    } finally {
      setApplying(false);
    }
  }

  async function toggleFavorite(job: Job) {
    if (!isAuthenticated) {
      navigate("/entrar", { state: { from: `/vagas/${job.id}` } });
      return;
    }
    if (!isCandidate || !user) {
      announce(
        "Apenas contas de candidato podem salvar vagas.",
        "assertive",
      );
      return;
    }
    const nowFav = await applicationService.toggleFavorite(user.id, {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
    });
    setFavorite(nowFav);
    announce(
      nowFav
        ? `${job.title} salva nos favoritos.`
        : `${job.title} removida dos favoritos.`,
    );
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
        {applied ? (
          <p className="job-detail__applied" role="status">
            ✓ Você já se candidatou a esta vaga.{" "}
            <Link to="/painel/candidaturas">Ver minhas candidaturas</Link>
          </p>
        ) : (
          <Button variant="primary" onClick={() => openApply(job)}>
            Candidatar-se a esta vaga
          </Button>
        )}

        <div className="job-detail__secondary">
          <Button
            variant="secondary"
            onClick={() => toggleFavorite(job)}
            aria-pressed={favorite}
          >
            {favorite ? "★ Salva nos favoritos" : "☆ Salvar vaga"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/entrar", { state: { from: `/vagas/${job.id}` } });
                return;
              }
              setReportOpen(true);
            }}
          >
            Denunciar vaga
          </Button>
        </div>

        {!isAuthenticated && (
          <p className="job-detail__muted">
            Você pode pesquisar sem conta; o login é solicitado apenas para se
            candidatar, favoritar ou denunciar.
          </p>
        )}
        {isAuthenticated && !isCandidate && (
          <p className="job-detail__muted" role="note">
            Apenas contas de candidato podem se candidatar, favoritar ou
            denunciar vagas.
          </p>
        )}
      </div>

      {/* --- Diálogo de candidatura com consentimento (C2.2 / NF2) --- */}
      <Modal
        isOpen={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Candidatar-se: ${job.title}`}
      >
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            confirmApply(job);
          }}
        >
          <p>
            Confirme sua candidatura para <strong>{job.title}</strong> na empresa{" "}
            {job.companyName}.
          </p>

          {myAccommodations.length > 0 ? (
            <fieldset className="field" style={{ border: 0, padding: 0 }}>
              <legend className="field__label">
                Compartilhar acomodações com a empresa?
              </legend>
              <p className="field__hint">
                Suas acomodações são sigilosas. Você pode compartilhá-las com
                esta empresa para facilitar o processo. Isso é opcional.
              </p>
              <label
                style={{
                  display: "flex",
                  gap: "var(--space-2)",
                  alignItems: "flex-start",
                  minHeight: "var(--touch-target)",
                }}
              >
                <input
                  type="checkbox"
                  checked={shareConsent}
                  onChange={(e) => setShareConsent(e.target.checked)}
                />
                <span>
                  Autorizo compartilhar:{" "}
                  {myAccommodations.map((f) => FEATURE_LABELS[f]).join(", ")}.
                </span>
              </label>
            </fieldset>
          ) : (
            <p className="job-detail__muted">
              Você pode cadastrar acomodações no seu perfil para compartilhá-las
              em futuras candidaturas.
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              marginTop: "var(--space-4)",
            }}
          >
            <Button type="submit" disabled={applying}>
              {applying ? "Enviando…" : "Confirmar candidatura"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setApplyOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Diálogo de denúncia (C3) --- */}
      {user && (
        <ReportDialog
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          reporterId={user.id}
          targetType="JOB"
          targetId={job.id}
          targetLabel={job.title}
        />
      )}
    </article>
  );
}

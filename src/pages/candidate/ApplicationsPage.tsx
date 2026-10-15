import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { applicationService } from "../../candidate/applicationService";
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from "../../candidate/types";
import { FEATURE_LABELS } from "../../jobs/types";

/** Ordem do fluxo, para mostrar o progresso de cada candidatura. */
const STATUS_ORDER: ApplicationStatus[] = [
  "SENT",
  "REVIEW",
  "INTERVIEW",
  "FINISHED",
];

/** Painel "Minhas candidaturas" com status e feedback acessível (C2.3, C2.5). */
export function ApplicationsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [apps, setApps] = useState<Application[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    applicationService.listByCandidate(user.id).then((list) => {
      if (active) setApps(list);
    });
    return () => {
      active = false;
    };
  }, [user]);

  async function withdraw(app: Application) {
    if (!user) return;
    await applicationService.withdraw(user.id, app.id);
    const list = await applicationService.listByCandidate(user.id);
    setApps(list);
    announce(`Candidatura para ${app.jobTitle} cancelada.`);
  }

  if (!apps) return <p aria-live="polite">Carregando suas candidaturas…</p>;

  if (apps.length === 0) {
    return (
      <div>
        <h2>Minhas candidaturas</h2>
        <p className="cand-muted">
          Você ainda não se candidatou a nenhuma vaga.
        </p>
        <p>
          <Link to="/vagas">Buscar vagas inclusivas →</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Minhas candidaturas</h2>
      <p className="cand-muted">
        {apps.length} {apps.length === 1 ? "candidatura" : "candidaturas"}.
      </p>

      <ul className="cand-list">
        {apps.map((app) => {
          const stepIndex = STATUS_ORDER.indexOf(app.status);
          return (
            <li key={app.id}>
              <article
                className="cand-card"
                aria-labelledby={`app-${app.id}-title`}
              >
                <h3 id={`app-${app.id}-title`} className="cand-card__title">
                  <Link to={`/vagas/${app.jobId}`}>{app.jobTitle}</Link>
                </h3>
                <p className="cand-card__meta">
                  {app.companyName} · candidatura em{" "}
                  {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                </p>

                {/* Progresso textual + visual acessível */}
                <p className="cand-status">
                  Status atual:{" "}
                  <strong>{APPLICATION_STATUS_LABELS[app.status]}</strong>
                </p>
                <ol className="cand-steps" aria-label="Andamento da candidatura">
                  {STATUS_ORDER.map((s, i) => (
                    <li
                      key={s}
                      className={
                        "cand-step" + (i <= stepIndex ? " cand-step--done" : "")
                      }
                    >
                      <span className="cand-step__dot" aria-hidden="true" />
                      <span>
                        {APPLICATION_STATUS_LABELS[s]}
                        {i === stepIndex && (
                          <span className="sr-only"> (etapa atual)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>

                {app.sharedAccommodations &&
                  app.sharedAccommodations.length > 0 && (
                    <p className="cand-muted">
                      Acomodações compartilhadas:{" "}
                      {app.sharedAccommodations
                        .map((f) => FEATURE_LABELS[f])
                        .join(", ")}
                      .
                    </p>
                  )}

                {app.status !== "FINISHED" && (
                  <Button variant="ghost" onClick={() => withdraw(app)}>
                    Cancelar candidatura
                  </Button>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

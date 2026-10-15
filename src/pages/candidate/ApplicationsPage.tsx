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
  type Notification,
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
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      applicationService.listByCandidate(user.id),
      applicationService.listNotifications(user.id),
    ]).then(([list, notes]) => {
      if (!active) return;
      setApps(list);
      setNotifications(notes);
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

      {notifications.length > 0 && (
        <section
          className="cand-notifications"
          aria-labelledby="notif-title"
        >
          <h3 id="notif-title">Atualizações recentes</h3>
          <ul>
            {notifications.slice(0, 5).map((n, i) => (
              <li key={i}>
                <strong>{n.jobTitle}</strong>: status atualizado para{" "}
                {APPLICATION_STATUS_LABELS[n.status]} em{" "}
                {new Date(n.createdAt).toLocaleDateString("pt-BR")}.
              </li>
            ))}
          </ul>
        </section>
      )}

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

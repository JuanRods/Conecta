import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { applicationService } from "../../candidate/applicationService";
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
} from "../../candidate/types";
import { jobService } from "../../jobs/jobService";
import { FEATURE_LABELS, type Job } from "../../jobs/types";

const STATUSES = Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[];

/** Gestão de candidaturas de uma vaga (E3). */
export function JobApplicationsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    let active = true;
    jobService.getOwnedById(user.id, id).then((owned) => {
      if (!active) return;
      if (!owned) {
        setDenied(true);
        return;
      }
      setJob(owned);
      applicationService.listByJob(id).then((list) => {
        if (active) setApps(list);
      });
    });
    return () => {
      active = false;
    };
  }, [user, id]);

  async function changeStatus(app: Application, status: ApplicationStatus) {
    await applicationService.updateStatus(app.id, status);
    if (id) setApps(await applicationService.listByJob(id));
    announce(
      `Status da candidatura atualizado para ${APPLICATION_STATUS_LABELS[status]}. O candidato será notificado.`,
    );
  }

  if (denied) {
    return (
      <div>
        <h2>Vaga não encontrada</h2>
        <p className="text-muted">
          Esta vaga não existe ou não pertence à sua empresa.
        </p>
        <p>
          <Link to="/empresa/vagas">← Voltar para minhas vagas</Link>
        </p>
      </div>
    );
  }

  if (!job || !apps) {
    return <p aria-live="polite">Carregando candidaturas…</p>;
  }

  return (
    <div>
      <p>
        <Link to="/empresa/vagas">← Minhas vagas</Link>
      </p>
      <h2>Candidaturas: {job.title}</h2>
      <p className="text-muted">
        {apps.length} {apps.length === 1 ? "candidatura" : "candidaturas"}.
      </p>

      {apps.length === 0 ? (
        <p className="text-muted">Esta vaga ainda não recebeu candidaturas.</p>
      ) : (
        <ul className="card-list">
          {apps.map((app) => (
            <li key={app.id}>
              <article
                className="card"
                aria-labelledby={`capp-${app.id}-title`}
              >
                <h3 id={`capp-${app.id}-title`} className="card__title">
                  Candidatura #{app.id.slice(0, 6)}
                </h3>
                <p className="card__meta">
                  Recebida em{" "}
                  {new Date(app.createdAt).toLocaleDateString("pt-BR")} · status
                  atual: <strong>{APPLICATION_STATUS_LABELS[app.status]}</strong>
                </p>

                {/* E3.1/E3.3: acomodações só aparecem se o candidato consentiu */}
                {app.sharedAccommodations &&
                app.sharedAccommodations.length > 0 ? (
                  <p className="comp-accom">
                    Acomodações compartilhadas pelo candidato:{" "}
                    {app.sharedAccommodations
                      .map((f) => FEATURE_LABELS[f])
                      .join(", ")}
                    .
                  </p>
                ) : (
                  <p className="text-muted">
                    O candidato não compartilhou acomodações (dado sigiloso).
                  </p>
                )}

                <div className="field comp-status-select">
                  <label
                    className="field__label"
                    htmlFor={`status-${app.id}`}
                  >
                    Atualizar status
                  </label>
                  <select
                    id={`status-${app.id}`}
                    className="field__input"
                    value={app.status}
                    onChange={(e) =>
                      changeStatus(app, e.target.value as ApplicationStatus)
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {APPLICATION_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

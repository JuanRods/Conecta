import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { jobService } from "../../jobs/jobService";
import {
  JOB_STATUS_LABELS,
  MODALITY_LABELS,
  type Job,
} from "../../jobs/types";

/** Lista e gestão das vagas da empresa (E2.4). */
export function CompanyJobsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [jobs, setJobs] = useState<Job[] | null>(null);

  async function refresh() {
    if (!user) return;
    setJobs(await jobService.listByCompany(user.id));
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    jobService.listByCompany(user.id).then((list) => {
      if (active) setJobs(list);
    });
    return () => {
      active = false;
    };
  }, [user]);

  async function pause(job: Job) {
    if (!user) return;
    await jobService.setStatus(user.id, job.id, "PAUSED");
    await refresh();
    announce(`Vaga "${job.title}" pausada.`);
  }

  async function close(job: Job) {
    if (!user) return;
    await jobService.setStatus(user.id, job.id, "CLOSED");
    await refresh();
    announce(`Vaga "${job.title}" encerrada.`);
  }

  async function resubmit(job: Job) {
    if (!user) return;
    await jobService.submitForReview(user.id, job.id);
    await refresh();
    announce(`Vaga "${job.title}" enviada à moderação.`);
  }

  async function duplicate(job: Job) {
    if (!user) return;
    await jobService.duplicate(user.id, job.id);
    await refresh();
    announce(`Vaga "${job.title}" duplicada como rascunho.`);
  }

  async function remove(job: Job) {
    if (!user) return;
    await jobService.remove(user.id, job.id);
    await refresh();
    announce(`Vaga "${job.title}" removida.`);
  }

  if (!jobs) return <p aria-live="polite">Carregando suas vagas…</p>;

  return (
    <div>
      <div className="comp-jobs__head">
        <h2>Minhas vagas</h2>
        <Link className="btn btn--primary" to="/empresa/vagas/nova">
          Nova vaga
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="comp-muted">
          Você ainda não criou vagas. Clique em “Nova vaga” para começar — ela
          passará por moderação antes de ficar pública.
        </p>
      ) : (
        <ul className="comp-list">
          {jobs.map((job) => (
            <li key={job.id}>
              <article
                className="comp-card"
                aria-labelledby={`cjob-${job.id}-title`}
              >
                <div className="comp-card__top">
                  <h3 id={`cjob-${job.id}-title`} className="comp-card__title">
                    {job.title}
                  </h3>
                  <span
                    className={
                      "comp-status comp-status--" + job.status.toLowerCase()
                    }
                  >
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
                <p className="comp-card__meta">
                  {job.area} · {MODALITY_LABELS[job.modality]} · {job.location}
                </p>

                <div className="comp-card__actions">
                  <Link
                    className="btn btn--secondary"
                    to={`/empresa/vagas/${job.id}/editar`}
                  >
                    Editar
                  </Link>
                  <Link
                    className="btn btn--ghost"
                    to={`/empresa/vagas/${job.id}/candidaturas`}
                  >
                    Candidaturas
                  </Link>

                  {job.status === "APPROVED" && (
                    <Button variant="ghost" onClick={() => pause(job)}>
                      Pausar
                    </Button>
                  )}
                  {(job.status === "DRAFT" ||
                    job.status === "PAUSED" ||
                    job.status === "REJECTED") && (
                    <Button variant="ghost" onClick={() => resubmit(job)}>
                      Enviar à moderação
                    </Button>
                  )}
                  {job.status !== "CLOSED" && (
                    <Button variant="ghost" onClick={() => close(job)}>
                      Encerrar
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => duplicate(job)}>
                    Duplicar
                  </Button>
                  <Button variant="ghost" onClick={() => remove(job)}>
                    Remover
                  </Button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

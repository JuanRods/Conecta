import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { AccessibilityBadges } from "../../jobs/AccessibilityBadges";
import { jobService } from "../../jobs/jobService";
import { companyService } from "../../company/companyService";
import { moderationService } from "../../admin/moderationService";
import { MODALITY_LABELS, type Job } from "../../jobs/types";
import type { Company } from "../../company/types";
import { ReasonDialog } from "./ReasonDialog";

type Dialog =
  | { kind: "reject-job"; job: Job }
  | { kind: "request-changes"; job: Job }
  | { kind: "reject-company"; company: Company }
  | null;

/** Fila de moderação: vagas pendentes e empresas a verificar (M1). */
export function ModerationQueuePage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const admin = user ? { id: user.id, name: user.name } : null;

  const refresh = useCallback(async () => {
    const [pendingJobs, pendingCompanies] = await Promise.all([
      jobService.listPending(),
      companyService.listPendingVerification(),
    ]);
    setJobs(pendingJobs);
    setCompanies(pendingCompanies);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      jobService.listPending(),
      companyService.listPendingVerification(),
    ]).then(([j, c]) => {
      if (!active) return;
      setJobs(j);
      setCompanies(c);
    });
    return () => {
      active = false;
    };
  }, []);

  async function approveJob(job: Job) {
    if (!admin) return;
    await moderationService.approveJob(admin, job.id);
    await refresh();
    announce(`Vaga "${job.title}" aprovada e publicada.`);
  }

  async function verifyCompany(company: Company) {
    if (!admin) return;
    await moderationService.verifyCompany(admin, company.userId);
    await refresh();
    announce(`Empresa "${company.name}" verificada.`);
  }

  if (!jobs || !companies) {
    return <p aria-live="polite">Carregando fila de moderação…</p>;
  }

  return (
    <div>
      {/* --- Vagas pendentes --- */}
      <section aria-labelledby="mod-jobs-title">
        <h2 id="mod-jobs-title">Vagas aguardando moderação</h2>
        {jobs.length === 0 ? (
          <p className="text-muted">Nenhuma vaga pendente. 🎉</p>
        ) : (
          <ul className="card-list">
            {jobs.map((job) => (
              <li key={job.id}>
                <article className="card" aria-labelledby={`mj-${job.id}`}>
                  <h3 id={`mj-${job.id}`} className="card__title">
                    {job.title}
                  </h3>
                  <p className="card__meta">
                    {job.companyName} · {job.area} ·{" "}
                    {MODALITY_LABELS[job.modality]} · {job.location}
                  </p>
                  <p>{job.description}</p>
                  <AccessibilityBadges features={job.accessibilityFeatures} />
                  <div className="card__actions">
                    <Button onClick={() => approveJob(job)}>Aprovar</Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDialog({ kind: "request-changes", job })}
                    >
                      Solicitar ajustes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setDialog({ kind: "reject-job", job })}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Empresas a verificar --- */}
      <section aria-labelledby="mod-companies-title" className="admin-section">
        <h2 id="mod-companies-title">Empresas a verificar</h2>
        {companies.length === 0 ? (
          <p className="text-muted">Nenhuma empresa pendente de verificação.</p>
        ) : (
          <ul className="card-list">
            {companies.map((company) => (
              <li key={company.userId}>
                <article
                  className="card"
                  aria-labelledby={`mc-${company.userId}`}
                >
                  <h3 id={`mc-${company.userId}`} className="card__title">
                    {company.name || "(sem nome)"}
                  </h3>
                  <p className="card__meta">
                    CNPJ {company.cnpj || "—"} · {company.sector || "setor não informado"}
                  </p>
                  {company.inclusionPolicy && (
                    <p>
                      <strong>Política de inclusão:</strong>{" "}
                      {company.inclusionPolicy}
                    </p>
                  )}
                  <div className="card__actions">
                    <Button onClick={() => verifyCompany(company)}>
                      Verificar empresa
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setDialog({ kind: "reject-company", company })
                      }
                    >
                      Recusar verificação
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Diálogos de justificativa --- */}
      <ReasonDialog
        isOpen={dialog?.kind === "reject-job"}
        title="Rejeitar vaga"
        label="Explique o motivo da rejeição (será enviado à empresa)"
        confirmText="Rejeitar vaga"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          if (admin && dialog?.kind === "reject-job") {
            await moderationService.rejectJob(admin, dialog.job.id, reason);
            await refresh();
            announce(`Vaga "${dialog.job.title}" rejeitada.`);
          }
        }}
      />
      <ReasonDialog
        isOpen={dialog?.kind === "request-changes"}
        title="Solicitar ajustes"
        label="Descreva os ajustes necessários (será enviado à empresa)"
        confirmText="Solicitar ajustes"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          if (admin && dialog?.kind === "request-changes") {
            await moderationService.rejectJob(
              admin,
              dialog.job.id,
              reason,
              true,
            );
            await refresh();
            announce(`Ajustes solicitados para "${dialog.job.title}".`);
          }
        }}
      />
      <ReasonDialog
        isOpen={dialog?.kind === "reject-company"}
        title="Recusar verificação"
        label="Explique o motivo (será enviado à empresa)"
        confirmText="Recusar verificação"
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          if (admin && dialog?.kind === "reject-company") {
            await moderationService.rejectCompanyVerification(
              admin,
              dialog.company.userId,
              reason,
            );
            await refresh();
            announce(`Verificação de "${dialog.company.name}" recusada.`);
          }
        }}
      />
    </div>
  );
}

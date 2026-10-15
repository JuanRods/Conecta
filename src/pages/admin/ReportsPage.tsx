import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { reportService } from "../../candidate/reportService";
import {
  REPORT_REASON_LABELS,
  type Report,
} from "../../candidate/types";
import { moderationService } from "../../admin/moderationService";

const TARGET_LABELS: Record<Report["targetType"], string> = {
  JOB: "Vaga",
  COMPANY: "Empresa",
  USER: "Usuário",
};

/** Gestão de denúncias pendentes (M2.1). */
export function ReportsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [reports, setReports] = useState<Report[] | null>(null);

  const admin = user ? { id: user.id, name: user.name } : null;

  async function refresh() {
    setReports(await reportService.listPending());
  }

  useEffect(() => {
    let active = true;
    reportService.listPending().then((list) => {
      if (active) setReports(list);
    });
    return () => {
      active = false;
    };
  }, []);

  async function archive(report: Report) {
    if (!admin) return;
    await moderationService.archiveReport(admin, report.id, report.targetLabel);
    await refresh();
    announce("Denúncia arquivada.");
  }

  if (!reports) return <p aria-live="polite">Carregando denúncias…</p>;

  return (
    <div>
      <h2>Denúncias pendentes</h2>
      {reports.length === 0 ? (
        <p className="text-muted">Nenhuma denúncia pendente.</p>
      ) : (
        <ul className="card-list">
          {reports.map((report) => (
            <li key={report.id}>
              <article className="card" aria-labelledby={`rep-${report.id}`}>
                <h3 id={`rep-${report.id}`} className="card__title">
                  {TARGET_LABELS[report.targetType]}: {report.targetLabel}
                </h3>
                <p className="card__meta">
                  Motivo: {REPORT_REASON_LABELS[report.reason]} · recebida em{" "}
                  {new Date(report.createdAt).toLocaleDateString("pt-BR")}
                </p>
                {report.details && <p>{report.details}</p>}
                <div className="card__actions">
                  <Button variant="secondary" onClick={() => archive(report)}>
                    Arquivar denúncia
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

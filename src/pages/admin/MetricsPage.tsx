import { useEffect, useState } from "react";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { metricsService, type AdminMetrics } from "../../admin/metricsService";
import { JOB_STATUS_LABELS, type JobStatus } from "../../jobs/types";

/** Painel de métricas com exportação CSV acessível (M3). */
export function MetricsPage() {
  const { announce } = useAnnouncer();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);

  useEffect(() => {
    let active = true;
    metricsService.get().then((m) => {
      if (active) setMetrics(m);
    });
    return () => {
      active = false;
    };
  }, []);

  function exportCsv() {
    if (!metrics) return;
    const csv = metricsService.toCsv(metrics);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conecta-metricas.csv";
    link.click();
    URL.revokeObjectURL(url);
    announce("Arquivo CSV de métricas gerado para download.");
  }

  if (!metrics) return <p aria-live="polite">Carregando métricas…</p>;

  const statuses = Object.keys(metrics.jobsByStatus) as JobStatus[];

  return (
    <div>
      <div className="comp-jobs__head">
        <h2>Métricas da plataforma</h2>
        <Button variant="secondary" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <h3>Usuários</h3>
      <ul className="stats" aria-label="Métricas de usuários">
        <li className="stat">
          <span className="stat__num">{metrics.users.total}</span>Total
        </li>
        <li className="stat">
          <span className="stat__num">{metrics.users.candidates}</span>
          Candidatos
        </li>
        <li className="stat">
          <span className="stat__num">{metrics.users.companies}</span>Empresas
        </li>
        <li className="stat">
          <span className="stat__num">{metrics.users.suspended}</span>
          Suspensas
        </li>
      </ul>

      <h3>Empresas</h3>
      <ul className="stats" aria-label="Métricas de empresas">
        <li className="stat">
          <span className="stat__num">{metrics.companies.verified}</span>
          Verificadas
        </li>
        <li className="stat">
          <span className="stat__num">{metrics.companies.pending}</span>
          Pendentes
        </li>
      </ul>

      <h3>Vagas por status</h3>
      <ul className="stats" aria-label="Métricas de vagas por status">
        {statuses.map((s) => (
          <li key={s} className="stat">
            <span className="stat__num">{metrics.jobsByStatus[s]}</span>
            {JOB_STATUS_LABELS[s]}
          </li>
        ))}
      </ul>

      <h3>Denúncias</h3>
      <ul className="stats" aria-label="Métricas de denúncias">
        <li className="stat">
          <span className="stat__num">{metrics.reports.pending}</span>
          Pendentes
        </li>
      </ul>
    </div>
  );
}

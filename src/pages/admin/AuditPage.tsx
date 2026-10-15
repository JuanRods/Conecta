import { useEffect, useState } from "react";
import { moderationService } from "../../admin/moderationService";
import {
  MODERATION_ACTION_LABELS,
  type ModerationAction,
} from "../../admin/types";

/** Log de auditoria de todas as ações de moderação (M1.4 / NF8). */
export function AuditPage() {
  const [entries, setEntries] = useState<ModerationAction[] | null>(null);

  useEffect(() => {
    let active = true;
    moderationService.listAudit().then((list) => {
      if (active) setEntries(list);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!entries) return <p aria-live="polite">Carregando auditoria…</p>;

  return (
    <div>
      <h2>Auditoria de moderação</h2>
      <p className="text-muted">
        Histórico imutável de todas as ações (quem, o quê, quando).
      </p>

      {entries.length === 0 ? (
        <p className="text-muted">Nenhuma ação registrada ainda.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <caption className="sr-only">
              Registros de ações de moderação
            </caption>
            <thead>
              <tr>
                <th scope="col">Data</th>
                <th scope="col">Administrador</th>
                <th scope="col">Ação</th>
                <th scope="col">Alvo</th>
                <th scope="col">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{e.adminName}</td>
                  <td>{MODERATION_ACTION_LABELS[e.action]}</td>
                  <td>{e.targetLabel}</td>
                  <td>{e.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

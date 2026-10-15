import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { moderationService } from "../../admin/moderationService";

/** Visão geral da moderação: contadores da fila (M1.1). */
export function AdminOverview() {
  const [counts, setCounts] = useState({ jobs: 0, companies: 0, reports: 0 });

  useEffect(() => {
    let active = true;
    moderationService.getQueueCounts().then((c) => {
      if (active) setCounts(c);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <ul className="stats" aria-label="Itens pendentes de moderação">
        <li className="stat">
          <span className="stat__num">{counts.jobs}</span>
          <Link to="/admin/moderacao">Vagas em moderação</Link>
        </li>
        <li className="stat">
          <span className="stat__num">{counts.companies}</span>
          <Link to="/admin/moderacao">Empresas a verificar</Link>
        </li>
        <li className="stat">
          <span className="stat__num">{counts.reports}</span>
          <Link to="/admin/denuncias">Denúncias pendentes</Link>
        </li>
      </ul>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { moderationService } from "../../admin/moderationService";

/**
 * Visão geral da moderação: contadores da fila (M1.1).
 *
 * Adota a linguagem visual de cartões/feed usada em CandidateOverview
 * (superfície branca sobre canvas cinza, sombra sutil, links azuis). Como não
 * há conteúdo lateral real, usa uma coluna de cartões centralizada em vez do
 * layout de 3 colunas.
 */
export function AdminOverview() {
  const [counts, setCounts] = useState({
    jobs: 0,
    companies: 0,
    reports: 0,
    campaigns: 0,
  });

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
    <div className="feed admin-overview">
      <div className="feed-card">
        <div className="feed-head">
          <h3 id="admin-fila-titulo">Itens pendentes de moderação</h3>
          <Link to="/admin/moderacao">Abrir fila</Link>
        </div>
        <ul className="stats" aria-labelledby="admin-fila-titulo">
          <li className="stat">
            <span className="stat__num">{counts.jobs}</span>
            <Link to="/admin/moderacao">Vagas em moderação</Link>
          </li>
          <li className="stat">
            <span className="stat__num">{counts.companies}</span>
            <Link to="/admin/moderacao">Empresas a verificar</Link>
          </li>
          <li className="stat">
            <span className="stat__num">{counts.campaigns}</span>
            <Link to="/admin/moderacao">Campanhas em moderação</Link>
          </li>
          <li className="stat">
            <span className="stat__num">{counts.reports}</span>
            <Link to="/admin/denuncias">Denúncias pendentes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

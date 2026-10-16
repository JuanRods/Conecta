import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { companyService } from "../../company/companyService";
import { jobService } from "../../jobs/jobService";
import {
  VERIFICATION_BADGE,
  VERIFICATION_LABELS,
  type VerificationStatus,
} from "../../company/types";

/**
 * Visão geral do painel da empresa: status de verificação e resumo de vagas.
 *
 * Adota a mesma linguagem visual de cartões/feed usada em CandidateOverview
 * (superfície branca sobre canvas cinza, sombra sutil, links azuis). Como não
 * há conteúdo lateral real, usa uma coluna de cartões centralizada em vez do
 * layout de 3 colunas — mantém o visual profissional sem inventar dados.
 */
export function CompanyOverview() {
  const { user } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [verification, setVerification] =
    useState<VerificationStatus>("PENDING");
  const [counts, setCounts] = useState({ total: 0, published: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      companyService.exists(user.id),
      companyService.get(user.id),
      jobService.listByCompany(user.id),
    ]).then(([exists, company, jobs]) => {
      if (!active) return;
      setHasProfile(exists);
      setVerification(company.verificationStatus);
      setCounts({
        total: jobs.length,
        published: jobs.filter((j) => j.status === "APPROVED").length,
        pending: jobs.filter((j) => j.status === "PENDING").length,
      });
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="feed comp-overview">
      {/* Cartão de status: perfil incompleto ou situação da verificação */}
      {!hasProfile ? (
        <div className="feed-card feed-card--highlight" role="note">
          <h3 className="feed-card__title">Complete o perfil da empresa</h3>
          <p className="feed-card__text">
            Complete o perfil da sua empresa para transmitir confiança e começar
            a publicar vagas.
          </p>
          <div className="feed-card__actions">
            <Link className="btn btn--primary" to="/empresa/perfil">
              Completar perfil da empresa
            </Link>
          </div>
        </div>
      ) : (
        <div className="feed-card">
          <div className="feed-head">
            <h3 id="comp-verificacao-titulo">Verificação da empresa</h3>
          </div>
          <p
            className={"badge badge--" + VERIFICATION_BADGE[verification]}
            role="status"
          >
            {VERIFICATION_LABELS[verification]}
          </p>
        </div>
      )}

      {/* Resumo de vagas como cartões de estatística */}
      <div className="feed-card">
        <div className="feed-head">
          <h3 id="comp-resumo-titulo">Resumo das suas vagas</h3>
          <Link to="/empresa/vagas">Ver todas</Link>
        </div>
        <ul className="stats" aria-labelledby="comp-resumo-titulo">
          <li className="stat">
            <span className="stat__num">{counts.total}</span>
            <Link to="/empresa/vagas">Vagas no total</Link>
          </li>
          <li className="stat">
            <span className="stat__num">{counts.published}</span>
            <span>Publicadas</span>
          </li>
          <li className="stat">
            <span className="stat__num">{counts.pending}</span>
            <span>Em moderação</span>
          </li>
        </ul>
      </div>

      {/* Ação principal: publicar nova vaga */}
      <div className="feed-card">
        <h3 className="feed-card__title">Publicar uma nova vaga</h3>
        <p className="feed-card__text">
          Divulgue uma oportunidade inclusiva e alcance pessoas com deficiência
          em busca de trabalho.
        </p>
        <div className="feed-card__actions">
          <Link className="btn btn--primary" to="/empresa/vagas/nova">
            Publicar uma nova vaga
          </Link>
        </div>
      </div>
    </div>
  );
}

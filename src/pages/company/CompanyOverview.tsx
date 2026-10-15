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

/** Visão geral do painel da empresa: status de verificação e resumo de vagas. */
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
    <div>
      {!hasProfile ? (
        <div className="callout callout--warning" role="note">
          <p>
            Complete o perfil da sua empresa para transmitir confiança e começar
            a publicar vagas.
          </p>
          <Link className="callout__link" to="/empresa/perfil">
            Completar perfil da empresa
          </Link>
        </div>
      ) : (
        <p
          className={"badge badge--" + VERIFICATION_BADGE[verification]}
          role="status"
        >
          {VERIFICATION_LABELS[verification]}
        </p>
      )}

      <ul className="stats" aria-label="Resumo das suas vagas">
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

      <p className="comp-overview__cta">
        <Link to="/empresa/vagas/nova">Publicar uma nova vaga →</Link>
      </p>
    </div>
  );
}

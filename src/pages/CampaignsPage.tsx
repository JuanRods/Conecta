import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { campaignService } from "../campaigns/campaignService";
import type { Campaign } from "../campaigns/types";
import "./CampaignsPage.css";

/** Iniciais da empresa para o emblema do card (fallback de logo). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Vitrine pública "Para empresas": mostra as CAMPANHAS/AÇÕES inclusivas das
 * empresas como cards amplos. Os cards são criados por usuários empresariais e
 * moderados pelo administrador — aqui aparecem apenas os APROVADOS.
 */
export function CampaignsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const headingId = useId();

  const isCompany = user?.role === "COMPANY";

  useEffect(() => {
    let active = true;
    campaignService.listApproved().then((list) => {
      if (!active) return;
      setCampaigns(list);
      announce(
        list.length === 0
          ? "Nenhuma campanha publicada ainda."
          : `${list.length} ${
              list.length === 1 ? "campanha publicada" : "campanhas publicadas"
            }.`,
      );
    });
    return () => {
      active = false;
    };
  }, [announce]);

  return (
    <div className="campaigns">
      <header className="campaigns__head">
        <div>
          <h1 id={headingId}>Campanhas e ações das empresas</h1>
          <p className="campaigns__lead">
            Conheça as iniciativas de empresas comprometidas com inclusão:
            contratações afirmativas, ações comunitárias e compromissos de
            acessibilidade. Cada campanha é criada pela empresa e revisada pela
            moderação do Conecta antes de ser publicada.
          </p>
        </div>
        {isCompany && (
          <Link className="btn btn--primary" to="/empresa/campanhas">
            Criar campanha da minha empresa
          </Link>
        )}
      </header>

      {!campaigns && <p aria-live="polite">Carregando campanhas…</p>}

      {campaigns && campaigns.length === 0 && (
        <div className="campaigns__empty">
          <p>
            Ainda não há campanhas publicadas. Volte em breve — ou, se você
            representa uma empresa,{" "}
            {isCompany ? (
              <Link to="/empresa/campanhas">crie a primeira campanha</Link>
            ) : (
              <Link to="/cadastro">crie uma conta empresarial</Link>
            )}
            .
          </p>
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <ul className="campaigns__list" aria-labelledby={headingId}>
          {campaigns.map((c) => (
            <li key={c.id}>
              <article
                className="campaign-card"
                aria-labelledby={`camp-${c.id}-title`}
              >
                <div className="campaign-card__banner" aria-hidden="true">
                  <span className="campaign-card__logo">
                    {initials(c.companyName)}
                  </span>
                  {c.tag && (
                    <span className="campaign-card__tag">{c.tag}</span>
                  )}
                </div>
                <div className="campaign-card__body">
                  <p className="campaign-card__company">{c.companyName}</p>
                  <h2 id={`camp-${c.id}-title`} className="campaign-card__title">
                    {c.title}
                  </h2>
                  {c.subtitle && (
                    <p className="campaign-card__subtitle">{c.subtitle}</p>
                  )}
                  <p className="campaign-card__desc">{c.description}</p>
                  {c.callToAction &&
                    (c.link ? (
                      <a
                        className="btn btn--primary campaign-card__cta"
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {c.callToAction}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    ) : (
                      <span className="campaign-card__cta-static">
                        {c.callToAction}
                      </span>
                    ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

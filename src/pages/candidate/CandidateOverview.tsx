import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { profileService } from "../../candidate/profileService";
import { applicationService } from "../../candidate/applicationService";
import { jobService } from "../../jobs/jobService";
import type { CandidateProfile } from "../../candidate/types";
import {
  APPLICATION_STATUS_LABELS,
  type Application,
} from "../../candidate/types";
import { MODALITY_LABELS, type Job } from "../../jobs/types";

const DISMISS_KEY = "conecta.feed.dismissProfileCta";

/** Dicas editoriais da barra lateral (conteúdo estático, curado). */
const TIPS = [
  {
    title: "Como pedir acomodações no processo seletivo",
    meta: "Guia · 4 min de leitura",
  },
  {
    title: "Lei de Cotas: o que diz a legislação para PcD",
    meta: "Direitos · 6 min de leitura",
  },
  {
    title: "Monte um currículo acessível em PDF com marcação",
    meta: "Carreira · 3 min de leitura",
  },
  {
    title: "Entrevistas: como falar das suas competências",
    meta: "Carreira · 5 min de leitura",
  },
];

/**
 * Visão geral do painel do candidato — layout de 3 colunas no estilo de uma
 * rede profissional, com a paleta do Conecta:
 *   esquerda: cartão de perfil e atalhos
 *   centro:   destaque de ação + vagas recomendadas + atualizações
 *   direita:  conteúdo editorial e links úteis
 */
export function CandidateOverview() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [alertsCount, setAlertsCount] = useState(0);
  const [recommended, setRecommended] = useState<Job[]>([]);
  const [ctaDismissed, setCtaDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "true",
  );

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      profileService.get(user.id),
      profileService.exists(user.id),
      applicationService.listByCandidate(user.id),
      applicationService.listFavorites(user.id),
      applicationService.listAlerts(user.id),
      jobService.search(),
    ]).then(([prof, exists, apps, favs, alerts, jobs]) => {
      if (!active) return;
      setProfile(prof);
      setHasProfile(exists);
      setApplications(apps);
      setFavoritesCount(favs.length);
      setAlertsCount(alerts.length);

      // "Recomendadas": prioriza vagas que oferecem as acomodações do perfil.
      const needed = prof.sensitive.accommodations;
      const ranked = [...jobs].sort(
        (a, b) => matchScore(b, needed) - matchScore(a, needed),
      );
      setRecommended(ranked.slice(0, 4));
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  function dismissCta() {
    localStorage.setItem(DISMISS_KEY, "true");
    setCtaDismissed(true);
  }

  const firstName = user.name.split(/\s+/)[0];

  return (
    <div className="cols-3">
      {/* ---------------- Coluna esquerda: perfil ---------------- */}
      <aside
        className="cols-3__side"
        aria-labelledby="resumo-perfil-titulo"
      >
        <h2 id="resumo-perfil-titulo" className="sr-only">
          Resumo do seu perfil
        </h2>

        <div className="profile-card">
          <div className="profile-card__cover" />
          <div className="profile-card__body">
            <Avatar
              name={user.name}
              className="profile-card__avatar"
              decorative
            />
            <h3 className="profile-card__name">{user.name}</h3>
            <p className="profile-card__headline">
              {profile?.headline?.trim() ||
                "Adicione um título profissional ao seu perfil"}
            </p>
            {profile?.skills && profile.skills.length > 0 && (
              <p className="profile-card__meta">
                {profile.skills.slice(0, 3).join(" · ")}
              </p>
            )}
          </div>

          <ul className="profile-card__list">
            <li>
              <Link className="profile-card__link" to="/painel/candidaturas">
                <span>Candidaturas</span>
                <span className="profile-card__count">
                  {applications.length}
                </span>
              </Link>
            </li>
            <li>
              <Link className="profile-card__link" to="/painel/favoritos">
                <span>Vagas salvas</span>
                <span className="profile-card__count">{favoritesCount}</span>
              </Link>
            </li>
            <li>
              <Link className="profile-card__link" to="/painel/favoritos">
                <span>Alertas ativos</span>
                <span className="profile-card__count">{alertsCount}</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="profile-card">
          <ul className="profile-card__list">
            <li>
              <Link className="profile-card__link" to="/painel/perfil">
                <span>Meu perfil</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
            <li>
              <Link className="profile-card__link" to="/painel/privacidade">
                <span>Privacidade e dados</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
            <li>
              <Link className="profile-card__link" to="/vagas">
                <span>Buscar vagas</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* ---------------- Coluna central: feed ---------------- */}
      <div className="cols-3__main">
        <section className="feed" aria-labelledby="feed-titulo">
          <h2 id="feed-titulo" className="sr-only">
            Suas atualizações e vagas recomendadas
          </h2>

          {/* Destaque: completar perfil (dispensável) */}
          {!hasProfile && !ctaDismissed && (
            <div className="feed-card feed-card--highlight">
              <button
                type="button"
                className="feed-card__dismiss"
                onClick={dismissCta}
                aria-label="Dispensar sugestão de completar o perfil"
              >
                <span aria-hidden="true">×</span>
              </button>
              <h3 className="feed-card__title">
                Olá {firstName}, seu perfil está incompleto
              </h3>
              <p className="feed-card__text">
                Perfis completos recebem mais convites de empresas
                comprometidas com acessibilidade. Leva poucos minutos.
              </p>
              <div className="feed-card__actions">
                <Link className="btn btn--primary" to="/painel/perfil">
                  Completar meu perfil
                </Link>
                <Button variant="secondary" onClick={dismissCta}>
                  Agora não
                </Button>
              </div>
            </div>
          )}

          {/* Vagas recomendadas */}
          <div className="feed-card">
            <div className="feed-head">
              <h3 id="recomendadas-titulo">Vagas recomendadas para você</h3>
              <Link to="/vagas">Ver todas</Link>
            </div>

            {recommended.length === 0 ? (
              <p className="text-muted">
                Ainda não há vagas publicadas para recomendar.
              </p>
            ) : (
              <ul
                className="card-list"
                aria-labelledby="recomendadas-titulo"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {recommended.map((job) => (
                  <li key={job.id} className="entity-card">
                    <span className="entity-card__media" aria-hidden="true">
                      {job.companyName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="entity-card__body">
                      <h4 className="entity-card__name">
                        <Link to={`/vagas/${job.id}`}>{job.title}</Link>
                      </h4>
                      <p className="entity-card__subtitle">
                        {job.companyName}
                      </p>
                      <p className="entity-card__meta">
                        {job.location} · {MODALITY_LABELS[job.modality]}
                      </p>
                      <div className="entity-card__action">
                        <Link
                          className="btn btn--secondary btn--sm"
                          to={`/vagas/${job.id}`}
                        >
                          Ver vaga
                          <span className="sr-only"> {job.title}</span>
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Atividade recente */}
          <div className="feed-card">
            <div className="feed-head">
              <h3 id="atividade-titulo">Suas candidaturas recentes</h3>
              <Link to="/painel/candidaturas">Ver todas</Link>
            </div>

            {applications.length === 0 ? (
              <p className="text-muted">
                Você ainda não se candidatou a nenhuma vaga.{" "}
                <Link to="/vagas">Encontrar vagas inclusivas</Link>.
              </p>
            ) : (
              <ul
                aria-labelledby="atividade-titulo"
                style={{ listStyle: "none", margin: 0, padding: 0 }}
              >
                {applications.slice(0, 3).map((app) => (
                  <li key={app.id} className="feed-job">
                    <span className="feed-job__logo" aria-hidden="true">
                      {app.companyName.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="feed-job__body">
                      <h4 className="feed-job__title">{app.jobTitle}</h4>
                      <p className="feed-job__meta">
                        {app.companyName} ·{" "}
                        {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <span className="badge badge--neutral">
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* ---------------- Coluna direita: conteúdo útil ---------------- */}
      <aside
        className="cols-3__side cols-3__side--right"
        aria-labelledby="lateral-titulo"
      >
        <h2 id="lateral-titulo" className="sr-only">
          Conteúdo e links úteis
        </h2>

        <div className="sidebar-card">
          <h3 className="sidebar-card__title">Conecta Conteúdo</h3>
          <ul className="sidebar-list">
            {TIPS.map((tip) => (
              <li key={tip.title}>
                {tip.title}
                <span className="sidebar-list__meta">{tip.meta}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-card">
          <h3 className="sidebar-card__title">Seus direitos</h3>
          <ul className="sidebar-list">
            <li>
              Informar deficiência é <strong>opcional</strong> e sigiloso.
            </li>
            <li>
              Acomodações só são compartilhadas com a empresa{" "}
              <strong>se você autorizar</strong>.
            </li>
            <li>
              <Link to="/painel/privacidade">
                Gerenciar meus dados (LGPD)
              </Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/** Pontua a vaga pela quantidade de acomodações necessárias que ela oferece. */
function matchScore(job: Job, needed: string[]): number {
  if (needed.length === 0) return 0;
  return job.accessibilityFeatures.filter((f) => needed.includes(f)).length;
}

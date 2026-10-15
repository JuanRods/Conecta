import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { profileService } from "../../candidate/profileService";
import { applicationService } from "../../candidate/applicationService";

/**
 * Visão geral do painel do candidato: atalhos e um resumo do estado atual
 * (perfil preenchido? quantas candidaturas, favoritos e alertas?).
 */
export function CandidateOverview() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    hasProfile: false,
    applications: 0,
    favorites: 0,
    alerts: 0,
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      profileService.exists(user.id),
      applicationService.listByCandidate(user.id),
      applicationService.listFavorites(user.id),
      applicationService.listAlerts(user.id),
    ]).then(([hasProfile, apps, favs, alerts]) => {
      if (!active) return;
      setSummary({
        hasProfile,
        applications: apps.length,
        favorites: favs.length,
        alerts: alerts.length,
      });
    });
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div>
      {!summary.hasProfile && (
        <div className="callout callout--warning" role="note">
          <p>
            Você ainda não completou seu perfil. Um perfil completo ajuda as
            empresas a encontrarem você.
          </p>
          <Link className="callout__link" to="/painel/perfil">
            Completar meu perfil
          </Link>
        </div>
      )}

      <ul className="stats" aria-label="Resumo da sua conta">
        <li className="stat">
          <span className="stat__num">{summary.applications}</span>
          <Link to="/painel/candidaturas">Candidaturas</Link>
        </li>
        <li className="stat">
          <span className="stat__num">{summary.favorites}</span>
          <Link to="/painel/favoritos">Vagas favoritas</Link>
        </li>
        <li className="stat">
          <span className="stat__num">{summary.alerts}</span>
          <Link to="/painel/favoritos">Alertas de vagas</Link>
        </li>
      </ul>

      <p className="cand-overview__cta">
        <Link to="/vagas">Buscar novas vagas inclusivas →</Link>
      </p>
    </div>
  );
}

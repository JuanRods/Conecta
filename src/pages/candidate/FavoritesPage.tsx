import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { applicationService } from "../../candidate/applicationService";
import { jobService } from "../../jobs/jobService";
import type { Favorite, JobAlert } from "../../candidate/types";

/** Favoritos e alertas de novas vagas (C2.4). */
export function FavoritesPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [favorites, setFavorites] = useState<Favorite[] | null>(null);
  const [alerts, setAlerts] = useState<JobAlert[] | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [area, setArea] = useState("");

  async function refresh() {
    if (!user) return;
    const [favs, al] = await Promise.all([
      applicationService.listFavorites(user.id),
      applicationService.listAlerts(user.id),
    ]);
    setFavorites(favs);
    setAlerts(al);
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      applicationService.listFavorites(user.id),
      applicationService.listAlerts(user.id),
      jobService.listAreas(),
    ]).then(([favs, al, ar]) => {
      if (!active) return;
      setFavorites(favs);
      setAlerts(al);
      setAreas(ar);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function removeFavorite(fav: Favorite) {
    if (!user) return;
    await applicationService.toggleFavorite(user.id, {
      id: fav.jobId,
      title: fav.jobTitle,
      companyName: fav.companyName,
    });
    await refresh();
    announce(`${fav.jobTitle} removida dos favoritos.`);
  }

  async function addAlert(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!keyword.trim() && !area.trim()) {
      announce(
        "Informe uma palavra-chave ou uma área para criar o alerta.",
        "assertive",
      );
      return;
    }
    await applicationService.addAlert(user.id, { keyword, area });
    setKeyword("");
    setArea("");
    await refresh();
    announce("Alerta de vagas criado.");
  }

  async function removeAlert(alert: JobAlert) {
    if (!user) return;
    await applicationService.removeAlert(user.id, alert.id);
    await refresh();
    announce("Alerta removido.");
  }

  if (!favorites || !alerts) {
    return <p aria-live="polite">Carregando favoritos e alertas…</p>;
  }

  return (
    <div>
      <h2>Favoritos e alertas</h2>

      {/* --- Favoritos --- */}
      <section aria-labelledby="fav-title" className="cand-section">
        <h3 id="fav-title">Vagas favoritas</h3>
        {favorites.length === 0 ? (
          <p className="cand-muted">
            Você ainda não salvou vagas. Use o botão “Salvar vaga” na busca ou
            no detalhe da vaga.
          </p>
        ) : (
          <ul className="cand-list">
            {favorites.map((fav) => (
              <li key={fav.jobId}>
                <article className="cand-card">
                  <h4 className="cand-card__title">
                    <Link to={`/vagas/${fav.jobId}`}>{fav.jobTitle}</Link>
                  </h4>
                  <p className="cand-card__meta">{fav.companyName}</p>
                  <Button variant="ghost" onClick={() => removeFavorite(fav)}>
                    Remover dos favoritos
                  </Button>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Alertas --- */}
      <section aria-labelledby="alert-title" className="cand-section">
        <h3 id="alert-title">Alertas de novas vagas</h3>
        <p className="cand-muted">
          Receba avisos quando surgirem vagas que combinam com seus critérios.
        </p>

        <form onSubmit={addAlert} className="cand-alert-form" noValidate>
          <Field
            id="alert-keyword"
            label="Palavra-chave"
            hint="Opcional"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className="field">
            <label className="field__label" htmlFor="alert-area">
              Área
            </label>
            <select
              id="alert-area"
              className="field__input"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            >
              <option value="">Qualquer</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="cand-actions">
            <Button type="submit">Criar alerta</Button>
          </div>
        </form>

        {alerts.length > 0 && (
          <ul className="cand-list" aria-label="Alertas configurados">
            {alerts.map((al) => (
              <li key={al.id}>
                <article className="cand-card cand-card--row">
                  <p>
                    {al.keyword && (
                      <>
                        Palavra-chave: <strong>{al.keyword}</strong>
                      </>
                    )}
                    {al.keyword && al.area && " · "}
                    {al.area && (
                      <>
                        Área: <strong>{al.area}</strong>
                      </>
                    )}
                  </p>
                  <Button variant="ghost" onClick={() => removeAlert(al)}>
                    Remover alerta
                  </Button>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

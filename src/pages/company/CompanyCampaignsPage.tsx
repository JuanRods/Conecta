import { useEffect, useId, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { Field } from "../../components/Field";
import { companyService } from "../../company/companyService";
import { campaignService } from "../../campaigns/campaignService";
import {
  CAMPAIGN_STATUS_BADGE,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TAGS,
  type Campaign,
} from "../../campaigns/types";

/**
 * Gestão de campanhas da empresa (E — fase de campanhas).
 * A empresa cria cards de campanha/ação que vão para a moderação (PENDING).
 * Depois de aprovados pelo admin, aparecem na vitrine pública "Para empresas".
 */
export function CompanyCampaignsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();

  const [companyName, setCompanyName] = useState("");
  const [list, setList] = useState<Campaign[] | null>(null);
  const [saving, setSaving] = useState(false);
  const formTitleId = useId();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tag, setTag] = useState<string>(CAMPAIGN_TAGS[0]);
  const [description, setDescription] = useState("");
  const [callToAction, setCallToAction] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh(companyId: string) {
    const mine = await campaignService.listByCompany(companyId);
    setList(mine);
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      companyService.get(user.id),
      campaignService.listByCompany(user.id),
    ]).then(([company, mine]) => {
      if (!active) return;
      setCompanyName(company.name || user.name);
      setList(mine);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) {
      setError("Informe ao menos um título e uma descrição para a campanha.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await campaignService.create(
        {
          companyId: user.id,
          title,
          subtitle,
          description,
          callToAction,
          link: link || undefined,
          tag,
        },
        companyName,
      );
      await refresh(user.id);
      setTitle("");
      setSubtitle("");
      setDescription("");
      setCallToAction("");
      setLink("");
      setTag(CAMPAIGN_TAGS[0]);
      announce("Campanha enviada para moderação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Campaign) {
    if (!user) return;
    await campaignService.remove(c.id, user.id);
    await refresh(user.id);
    announce("Campanha removida.");
  }

  return (
    <div className="comp-campaigns">
      {/* --- Formulário de criação --- */}
      <section aria-labelledby={formTitleId}>
        <h2 id={formTitleId}>Criar campanha ou ação</h2>
        <p className="text-muted">
          Divulgue uma campanha ou ação inclusiva da sua empresa. Ela será
          revisada pela moderação do Conecta antes de aparecer na vitrine
          pública. Descreva com clareza os recursos de acessibilidade
          oferecidos.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="Título da campanha"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            hint="Ex.: Programa Talentos sem Barreiras"
            error={error && !title.trim() ? error : undefined}
          />
          <Field
            label="Subtítulo"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            hint="Uma linha curta de contexto (empresa · tipo de ação)"
          />

          <div className="field">
            <label className="field__label" htmlFor="campaign-tag">
              Categoria
            </label>
            <select
              id="campaign-tag"
              className="field__input"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {CAMPAIGN_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="campaign-desc">
              Descrição da campanha
              <span className="field__required" aria-hidden="true">
                {" "}
                *
              </span>
              <span className="sr-only"> (obrigatório)</span>
            </label>
            <textarea
              id="campaign-desc"
              className="field__input"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-describedby="campaign-desc-hint"
              required
            />
            <p id="campaign-desc-hint" className="field__hint">
              Explique o objetivo da ação e os recursos de acessibilidade
              envolvidos.
            </p>
          </div>

          <Field
            label="Texto do botão (chamada para ação)"
            value={callToAction}
            onChange={(e) => setCallToAction(e.target.value)}
            hint="Ex.: Quero participar do programa"
          />
          <Field
            label="Link (opcional)"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            hint="Página da campanha. Deixe em branco se não houver."
            placeholder="https://"
          />

          {error && title.trim() && (
            <p className="field__error" role="alert">
              {error}
            </p>
          )}

          <div className="form-actions">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Enviando…" : "Enviar para moderação"}
            </Button>
          </div>
        </form>
      </section>

      {/* --- Lista das campanhas da empresa --- */}
      <section aria-labelledby="comp-campaigns-list" className="admin-section">
        <h2 id="comp-campaigns-list">Minhas campanhas</h2>
        {!list && <p aria-live="polite">Carregando…</p>}
        {list && list.length === 0 && (
          <p className="text-muted">
            Você ainda não criou nenhuma campanha. Use o formulário acima para
            começar.
          </p>
        )}
        {list && list.length > 0 && (
          <ul className="card-list">
            {list.map((c) => (
              <li key={c.id}>
                <article className="card" aria-labelledby={`cc-${c.id}`}>
                  <div className="card__top">
                    <h3 id={`cc-${c.id}`} className="card__title">
                      {c.title}
                    </h3>
                    <span
                      className={`badge badge--${CAMPAIGN_STATUS_BADGE[c.status]}`}
                    >
                      {CAMPAIGN_STATUS_LABELS[c.status]}
                    </span>
                  </div>
                  <p className="card__meta">
                    {c.tag}
                    {c.subtitle ? ` · ${c.subtitle}` : ""}
                  </p>
                  <p>{c.description}</p>
                  {c.status === "REJECTED" && c.reviewReason && (
                    <p className="callout callout--warning">
                      <strong>Motivo da recusa:</strong> {c.reviewReason}
                    </p>
                  )}
                  <div className="card__actions">
                    <Button variant="ghost" onClick={() => handleDelete(c)}>
                      Excluir
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

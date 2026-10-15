import { useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { AccessibilityBadges } from "../jobs/AccessibilityBadges";
import { jobService } from "../jobs/jobService";
import {
  FEATURE_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
  type AccessibilityFeature,
  type Job,
  type JobFilters,
  type Level,
  type Modality,
} from "../jobs/types";
import { useAnnouncer } from "../accessibility/Announcer";
import "./JobsPage.css";

const MODALITIES = Object.keys(MODALITY_LABELS) as Modality[];
const LEVELS = Object.keys(LEVEL_LABELS) as Level[];
const FEATURES = Object.keys(FEATURE_LABELS) as AccessibilityFeature[];

/** Lê os filtros da URL (permite compartilhar/retornar à mesma busca). */
function filtersFromParams(params: URLSearchParams): JobFilters {
  const features = params.getAll("feature") as AccessibilityFeature[];
  return {
    keyword: params.get("q") ?? undefined,
    location: params.get("local") ?? undefined,
    modality: (params.get("modalidade") as Modality) || undefined,
    level: (params.get("nivel") as Level) || undefined,
    area: params.get("area") ?? undefined,
    features: features.length ? features : undefined,
  };
}

function paramsFromFilters(filters: JobFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.keyword) params.set("q", filters.keyword);
  if (filters.location) params.set("local", filters.location);
  if (filters.modality) params.set("modalidade", filters.modality);
  if (filters.level) params.set("nivel", filters.level);
  if (filters.area) params.set("area", filters.area);
  filters.features?.forEach((f) => params.append("feature", f));
  return params;
}

/**
 * Busca pública de vagas (Fase 3 — P2, A3).
 * - Busca por palavra-chave, local, modalidade, nível, área e recursos de a11y.
 * - Resultados anunciados em região aria-live (quantidade e estado).
 * - Mostra apenas vagas APPROVED (regra aplicada no jobService).
 * - Filtros refletidos na URL para compartilhamento e navegação de retorno.
 */
export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { announce } = useAnnouncer();

  const [filters, setFilters] = useState<JobFilters>(() =>
    filtersFromParams(searchParams),
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const resultsHeadingId = useId();

  // Carrega as áreas disponíveis uma vez (alimenta o filtro de área).
  useEffect(() => {
    let active = true;
    jobService.listAreas().then((a) => {
      if (active) setAreas(a);
    });
    return () => {
      active = false;
    };
  }, []);

  // Executa a busca sempre que os parâmetros da URL mudarem.
  useEffect(() => {
    let active = true;
    const current = filtersFromParams(searchParams);
    setLoading(true);
    announce("Buscando vagas…");
    jobService.search(current).then((results) => {
      if (!active) return;
      setJobs(results);
      setLoading(false);
      announce(
        results.length === 0
          ? "Nenhuma vaga encontrada para os filtros aplicados."
          : `${results.length} ${
              results.length === 1 ? "vaga encontrada" : "vagas encontradas"
            }.`,
      );
    });
    return () => {
      active = false;
    };
  }, [searchParams, announce]);

  function updateFilter<K extends keyof JobFilters>(
    key: K,
    value: JobFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFeature(feature: AccessibilityFeature, checked: boolean) {
    setFilters((prev) => {
      const set = new Set(prev.features ?? []);
      if (checked) set.add(feature);
      else set.delete(feature);
      const next = [...set];
      return { ...prev, features: next.length ? next : undefined };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams(paramsFromFilters(filters));
  }

  function handleClear() {
    const empty: JobFilters = {};
    setFilters(empty);
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="jobs">
      <header className="jobs__head">
        <h1>Buscar vagas inclusivas</h1>
        <p className="jobs__lead">
          Encontre oportunidades em empresas comprometidas com acessibilidade.
          Você não precisa de conta para pesquisar — o login é solicitado apenas
          ao se candidatar.
        </p>
      </header>

      <form
        id="form-busca"
        className="jobs__form"
        onSubmit={handleSubmit}
        aria-labelledby="form-busca-titulo"
      >
        <h2 id="form-busca-titulo" className="sr-only">
          Filtros de busca
        </h2>

        <div className="jobs__row">
          <Field
            label="Palavra-chave"
            hint="Cargo, tecnologia ou empresa"
            value={filters.keyword ?? ""}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            type="search"
          />
          <Field
            label="Localização"
            hint="Cidade, estado ou “remoto”"
            value={filters.location ?? ""}
            onChange={(e) => updateFilter("location", e.target.value)}
            type="search"
          />
        </div>

        <fieldset id="filtros-vaga" className="jobs__fieldset">
          <legend>Filtros</legend>

          <div className="jobs__row">
            <div className="field">
              <label className="field__label" htmlFor="filtro-modalidade">
                Modalidade
              </label>
              <select
                id="filtro-modalidade"
                className="field__input"
                value={filters.modality ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "modality",
                    (e.target.value as Modality) || undefined,
                  )
                }
              >
                <option value="">Todas</option>
                {MODALITIES.map((m) => (
                  <option key={m} value={m}>
                    {MODALITY_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="filtro-nivel">
                Nível
              </label>
              <select
                id="filtro-nivel"
                className="field__input"
                value={filters.level ?? ""}
                onChange={(e) =>
                  updateFilter("level", (e.target.value as Level) || undefined)
                }
              >
                <option value="">Todos</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {LEVEL_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="filtro-area">
                Área
              </label>
              <select
                id="filtro-area"
                className="field__input"
                value={filters.area ?? ""}
                onChange={(e) =>
                  updateFilter("area", e.target.value || undefined)
                }
              >
                <option value="">Todas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset id="filtro-recursos" className="jobs__features">
            <legend>Recursos de acessibilidade</legend>
            <div className="jobs__checks">
              {FEATURES.map((f) => {
                const checked = filters.features?.includes(f) ?? false;
                return (
                  <label key={f} className="jobs__check">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleFeature(f, e.target.checked)}
                    />
                    <span>{FEATURE_LABELS[f]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="jobs__actions">
            <Button type="submit" variant="primary">
              Buscar
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear}>
              Limpar filtros
            </Button>
          </div>
        </fieldset>
      </form>

      <section aria-labelledby={resultsHeadingId} className="jobs__results">
        <h2 id={resultsHeadingId} aria-live="polite">
          {loading
            ? "Buscando vagas…"
            : jobs.length === 0
              ? "Nenhuma vaga encontrada"
              : `${jobs.length} ${jobs.length === 1 ? "vaga" : "vagas"}`}
        </h2>

        {!loading && jobs.length === 0 && (
          <p className="jobs__empty">
            Ajuste os filtros ou limpe-os para ver todas as vagas disponíveis.
          </p>
        )}

        <ul className="jobs__list">
          {jobs.map((job) => (
            <li key={job.id}>
              <article
                className="job-card"
                aria-labelledby={`job-${job.id}-title`}
              >
                <h3 id={`job-${job.id}-title`} className="job-card__title">
                  <Link to={`/vagas/${job.id}`}>{job.title}</Link>
                </h3>
                <p className="job-card__meta">
                  <span className="job-card__company">{job.companyName}</span>
                  {" · "}
                  <span>{job.location}</span>
                  {" · "}
                  <span>{MODALITY_LABELS[job.modality]}</span>
                  {" · "}
                  <span>{LEVEL_LABELS[job.level]}</span>
                </p>
                <p className="job-card__desc">{job.description}</p>
                <AccessibilityBadges features={job.accessibilityFeatures} />
                <p className="job-card__cta">
                  <Link className="job-card__link" to={`/vagas/${job.id}`}>
                    Ver detalhes da vaga
                    <span className="sr-only"> — {job.title}</span>
                  </Link>
                </p>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

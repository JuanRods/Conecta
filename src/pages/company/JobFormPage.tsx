import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { useGuidedTour } from "../../accessibility/GuidedTour";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";
import { companyService } from "../../company/companyService";
import {
  analyzeDescription,
  INCLUSIVE_TIPS,
  type LanguageFinding,
} from "../../company/inclusiveLanguage";
import { jobService } from "../../jobs/jobService";
import {
  FEATURE_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
  type AccessibilityFeature,
  type Level,
  type Modality,
} from "../../jobs/types";

const MODALITIES = Object.keys(MODALITY_LABELS) as Modality[];
const LEVELS = Object.keys(LEVEL_LABELS) as Level[];
const FEATURES = Object.keys(FEATURE_LABELS) as AccessibilityFeature[];

interface JobForm {
  title: string;
  description: string;
  location: string;
  modality: Modality;
  level: Level;
  area: string;
  accessibilityFeatures: AccessibilityFeature[];
}

const EMPTY: JobForm = {
  title: "",
  description: "",
  location: "",
  modality: "REMOTE",
  level: "MID",
  area: "",
  accessibilityFeatures: [],
};

/** Criação e edição de vaga, com envio automático à moderação (E2.1-E2.3). */
export function JobFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const { startTour, isTourCompleted } = useGuidedTour();
  const navigate = useNavigate();

  const [form, setForm] = useState<JobForm>(EMPTY);
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [findings, setFindings] = useState<LanguageFinding[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    companyService.get(user.id).then((c) => {
      if (active) setCompanyName(c.name || user.name);
    });
    if (isEditing && id) {
      jobService.getOwnedById(user.id, id).then((job) => {
        if (!active) return;
        if (job) {
          setForm({
            title: job.title,
            description: job.description,
            location: job.location,
            modality: job.modality,
            level: job.level,
            area: job.area,
            accessibilityFeatures: job.accessibilityFeatures,
          });
        }
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [user, id, isEditing]);

  // Tour guiado de publicação de vaga na primeira criação (A5.7).
  useEffect(() => {
    if (isEditing || loading) return;
    if (isTourCompleted("publicar-vaga")) return;
    startTour({
      id: "publicar-vaga",
      steps: [
        {
          target: "#job-title",
          title: "Dê um título claro",
          description:
            "Descreva o cargo de forma objetiva e inclusiva (ex.: Pessoa Desenvolvedora Front-end).",
        },
        {
          target: "#job-description",
          title: "Detalhe a vaga",
          description:
            "Explique responsabilidades e requisitos essenciais. Depois use o verificador de linguagem inclusiva.",
        },
        {
          target: "#assist-title",
          title: "Assistente de linguagem inclusiva",
          description:
            "Verifique termos a evitar e siga as dicas para uma descrição acolhedora.",
        },
        {
          target: "#job-form-title",
          title: "Envio à moderação",
          description:
            "Ao salvar, a vaga vai para a moderação e fica pública somente após aprovação.",
        },
      ],
    });
  }, [isEditing, loading, startTour, isTourCompleted]);

  function update<K extends keyof JobForm>(key: K, value: JobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFeature(f: AccessibilityFeature, checked: boolean) {
    const set = new Set(form.accessibilityFeatures);
    if (checked) set.add(f);
    else set.delete(f);
    update("accessibilityFeatures", [...set]);
  }

  function checkLanguage() {
    const result = analyzeDescription(form.description);
    setFindings(result);
    announce(
      result.length === 0
        ? "Nenhum termo a revisar encontrado na descrição."
        : `${result.length} ${
            result.length === 1 ? "termo" : "termos"
          } a revisar na descrição.`,
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const found: { fieldId?: string; message: string }[] = [];
    if (!form.title.trim())
      found.push({ fieldId: "job-title", message: "Informe o título da vaga." });
    if (!form.description.trim())
      found.push({
        fieldId: "job-description",
        message: "Descreva a vaga.",
      });
    if (!form.area.trim())
      found.push({ fieldId: "job-area", message: "Informe a área da vaga." });
    setErrors(found);
    if (found.length > 0) {
      announce("Há erros no formulário.", "assertive");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await jobService.update(user.id, id, { ...form });
        announce(
          "Vaga atualizada e reenviada à moderação (quando aplicável).",
        );
      } else {
        await jobService.create({
          ...form,
          companyId: user.id,
          companyName,
        });
        announce(
          "Vaga criada e enviada à moderação. Ela ficará pública após aprovação.",
        );
      }
      navigate("/empresa/vagas");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p aria-live="polite">Carregando vaga…</p>;

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="job-form-title">
      <h2 id="job-form-title">{isEditing ? "Editar vaga" : "Nova vaga"}</h2>
      <p className="text-muted">
        Toda vaga passa por moderação antes de ficar visível ao público.
      </p>

      <FormErrorSummary errors={errors} />

      <fieldset className="form-fieldset">
        <legend>Dados da vaga</legend>

        <Field
          id="job-title"
          label="Título"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          error={errors.find((er) => er.fieldId === "job-title")?.message}
        />

        <div className="field">
          <label className="field__label" htmlFor="job-description">
            Descrição{" "}
            <span className="field__required" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </label>
          <textarea
            id="job-description"
            className="field__input"
            rows={6}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            aria-invalid={
              errors.some((er) => er.fieldId === "job-description") || undefined
            }
          />
          {errors.find((er) => er.fieldId === "job-description") && (
            <p className="field__error" role="alert">
              {errors.find((er) => er.fieldId === "job-description")?.message}
            </p>
          )}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={checkLanguage}>
              Verificar linguagem inclusiva
            </Button>
          </div>
        </div>

        <div className="form-row">
          <Field
            id="job-location"
            label="Localização"
            hint="Cidade/UF ou “remoto”."
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
          <Field
            id="job-area"
            label="Área"
            value={form.area}
            onChange={(e) => update("area", e.target.value)}
            required
            error={errors.find((er) => er.fieldId === "job-area")?.message}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label className="field__label" htmlFor="job-modality">
              Modalidade
            </label>
            <select
              id="job-modality"
              className="field__input"
              value={form.modality}
              onChange={(e) => update("modality", e.target.value as Modality)}
            >
              {MODALITIES.map((m) => (
                <option key={m} value={m}>
                  {MODALITY_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="job-level">
              Nível
            </label>
            <select
              id="job-level"
              className="field__input"
              value={form.level}
              onChange={(e) => update("level", e.target.value as Level)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="form-group">
          <legend>Recursos de acessibilidade da vaga</legend>
          <div className="choice-grid">
            {FEATURES.map((f) => (
              <label key={f} className="choice">
                <input
                  type="checkbox"
                  checked={form.accessibilityFeatures.includes(f)}
                  onChange={(e) => toggleFeature(f, e.target.checked)}
                />
                <span>{FEATURE_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {/* Assistente de descrição inclusiva (E2.2) */}
      <section className="comp-assistant" aria-labelledby="assist-title">
        <h3 id="assist-title">Assistente de descrição inclusiva</h3>
        <div aria-live="polite">
          {findings.length === 0 ? (
            <p className="text-muted">
              Clique em “Verificar linguagem inclusiva” para analisar a descrição.
              Dicas abaixo ajudam a escrever de forma acolhedora.
            </p>
          ) : (
            <ul className="comp-findings">
              {findings.map((f) => (
                <li key={f.term}>
                  <strong>{f.term}</strong>: {f.suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <details className="comp-tips">
          <summary>Dicas para uma vaga inclusiva</summary>
          <ul>
            {INCLUSIVE_TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      </section>

      <div className="form-actions">
        <Button type="submit" disabled={saving}>
          {saving
            ? "Salvando…"
            : isEditing
              ? "Salvar alterações"
              : "Criar e enviar à moderação"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/empresa/vagas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";
import {
  companyService,
  formatCnpj,
  isValidCnpj,
} from "../../company/companyService";
import {
  VERIFICATION_LABELS,
  type Company,
} from "../../company/types";
import { FEATURE_LABELS, type AccessibilityFeature } from "../../jobs/types";

const FEATURES = Object.keys(FEATURE_LABELS) as AccessibilityFeature[];

/** Perfil institucional da empresa (E1). */
export function CompanyProfilePage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [company, setCompany] = useState<Company | null>(null);
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    companyService.get(user.id).then((c) => {
      if (active) setCompany(c);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (!company) return <p aria-live="polite">Carregando perfil da empresa…</p>;

  function update<K extends keyof Company>(key: K, value: Company[K]) {
    setCompany((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleFeature(f: AccessibilityFeature, checked: boolean) {
    const set = new Set(company!.accessibilityFeatures);
    if (checked) set.add(f);
    else set.delete(f);
    update("accessibilityFeatures", [...set]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { fieldId?: string; message: string }[] = [];
    if (!company!.name.trim())
      found.push({ fieldId: "comp-name", message: "Informe o nome da empresa." });
    if (!isValidCnpj(company!.cnpj))
      found.push({
        fieldId: "comp-cnpj",
        message: "Informe um CNPJ válido (14 dígitos).",
      });
    setErrors(found);
    if (found.length > 0) {
      announce("Há erros no formulário.", "assertive");
      return;
    }

    setSaving(true);
    try {
      const saved = await companyService.save(company!);
      setCompany(saved);
      setSavedAt(saved.updatedAt);
      announce("Perfil da empresa salvo com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="comp-profile-title">
      <h2 id="comp-profile-title">Perfil da empresa</h2>

      <p
        className={
          "comp-badge comp-badge--" + company.verificationStatus.toLowerCase()
        }
        role="status"
      >
        {VERIFICATION_LABELS[company.verificationStatus]}
      </p>

      <FormErrorSummary errors={errors} />

      {savedAt && (
        <p className="comp-success" role="status">
          Perfil salvo em {new Date(savedAt).toLocaleString("pt-BR")}.
        </p>
      )}

      <fieldset className="comp-fieldset">
        <legend>Dados institucionais</legend>

        <Field
          id="comp-name"
          label="Nome da empresa"
          value={company.name}
          onChange={(e) => update("name", e.target.value)}
          required
          error={errors.find((er) => er.fieldId === "comp-name")?.message}
        />

        <Field
          id="comp-cnpj"
          label="CNPJ"
          hint="Apenas números ou no formato 00.000.000/0000-00."
          value={company.cnpj}
          onChange={(e) => update("cnpj", formatCnpj(e.target.value))}
          inputMode="numeric"
          required
          error={errors.find((er) => er.fieldId === "comp-cnpj")?.message}
        />

        <Field
          id="comp-sector"
          label="Setor"
          hint="Ex.: Tecnologia, Saúde, Varejo."
          value={company.sector}
          onChange={(e) => update("sector", e.target.value)}
        />

        <Field
          id="comp-website"
          label="Site"
          hint="Opcional."
          type="url"
          value={company.website ?? ""}
          onChange={(e) => update("website", e.target.value)}
        />

        <div className="field">
          <label className="field__label" htmlFor="comp-desc">
            Descrição da empresa
          </label>
          <textarea
            id="comp-desc"
            className="field__input"
            rows={4}
            value={company.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="comp-fieldset">
        <legend>Compromisso com a inclusão</legend>
        <div className="field">
          <label className="field__label" htmlFor="comp-policy">
            Políticas de inclusão
          </label>
          <p id="comp-policy-hint" className="field__hint">
            Descreva práticas, metas e ações de inclusão de PcD na empresa.
          </p>
          <textarea
            id="comp-policy"
            className="field__input"
            rows={4}
            aria-describedby="comp-policy-hint"
            value={company.inclusionPolicy}
            onChange={(e) => update("inclusionPolicy", e.target.value)}
          />
        </div>

        <fieldset className="comp-features">
          <legend>Recursos de acessibilidade oferecidos</legend>
          <div className="comp-checks">
            {FEATURES.map((f) => (
              <label key={f} className="comp-check">
                <input
                  type="checkbox"
                  checked={company.accessibilityFeatures.includes(f)}
                  onChange={(e) => toggleFeature(f, e.target.checked)}
                />
                <span>{FEATURE_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      <div className="comp-actions">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}

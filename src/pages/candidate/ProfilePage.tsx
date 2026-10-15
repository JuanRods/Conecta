import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { useGuidedTour } from "../../accessibility/GuidedTour";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";
import {
  ACCEPTED_RESUME_EXTENSIONS,
  isAcceptedResume,
  profileService,
} from "../../candidate/profileService";
import {
  DISABILITY_LABELS,
  VISIBILITY_LABELS,
  type CandidateProfile,
  type DisabilityType,
  type ProfileVisibility,
} from "../../candidate/types";
import {
  FEATURE_LABELS,
  type AccessibilityFeature,
} from "../../jobs/types";

const DISABILITIES = Object.keys(DISABILITY_LABELS) as DisabilityType[];
const VISIBILITIES = Object.keys(VISIBILITY_LABELS) as ProfileVisibility[];
const FEATURES = Object.keys(FEATURE_LABELS) as AccessibilityFeature[];

/** Perfil profissional acessível do candidato (C1). */
export function ProfilePage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const { startTour, isTourCompleted } = useGuidedTour();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [skillsText, setSkillsText] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    profileService.get(user.id).then((p) => {
      if (!active) return;
      setProfile(p);
      setSkillsText(p.skills.join(", "));
    });
    return () => {
      active = false;
    };
  }, [user]);

  // Tour guiado do perfil na primeira visita (A5).
  useEffect(() => {
    if (!profile) return;
    if (isTourCompleted("perfil-candidato")) return;
    startTour({
      id: "perfil-candidato",
      steps: [
        {
          target: "#perfil-profissional",
          title: "Dados profissionais",
          description:
            "Preencha experiência, formação e habilidades. Isso ajuda empresas a encontrarem você.",
        },
        {
          target: "#perfil-sensivel",
          title: "Informações opcionais e sigilosas",
          description:
            "Tipo de deficiência e acomodações são opcionais, criptografados e só compartilhados com seu consentimento.",
        },
        {
          target: "#perfil-curriculo",
          title: "Currículo acessível",
          description:
            "Anexe seu currículo em PDF ou Word. Prefira PDFs com marcação (tags) para leitores de tela.",
        },
        {
          target: "#perfil-visibilidade",
          title: "Controle de visibilidade",
          description:
            "Você decide quem vê seu perfil: público, apenas empresas das vagas em que se candidatou, ou privado.",
        },
      ],
    });
  }, [profile, startTour, isTourCompleted]);

  if (!profile) {
    return <p aria-live="polite">Carregando seu perfil…</p>;
  }

  function update<K extends keyof CandidateProfile>(
    key: K,
    value: CandidateProfile[K],
  ) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateSensitive<K extends keyof CandidateProfile["sensitive"]>(
    key: K,
    value: CandidateProfile["sensitive"][K],
  ) {
    setProfile((prev) =>
      prev ? { ...prev, sensitive: { ...prev.sensitive, [key]: value } } : prev,
    );
  }

  function toggleAccommodation(f: AccessibilityFeature, checked: boolean) {
    const set = new Set(profile!.sensitive.accommodations);
    if (checked) set.add(f);
    else set.delete(f);
    updateSensitive("accommodations", [...set]);
  }

  async function handleResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAcceptedResume(file)) {
      setErrors([
        {
          fieldId: "curriculo",
          message:
            "Formato não aceito. Envie um arquivo PDF, DOC ou DOCX acessível.",
        },
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setErrors((prev) => prev.filter((er) => er.fieldId !== "curriculo"));
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
    update("resume", {
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
      uploadedAt: new Date().toISOString(),
    });
    announce(`Currículo anexado: ${file.name}.`);
  }

  function removeResume() {
    update("resume", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
    announce("Currículo removido.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { fieldId?: string; message: string }[] = [];
    if (!profile!.headline.trim())
      found.push({
        fieldId: "headline",
        message: "Informe um título profissional (ex.: Desenvolvedora Front-end).",
      });
    setErrors(found);
    if (found.length > 0) {
      announce("Há erros no formulário.", "assertive");
      return;
    }

    setSaving(true);
    try {
      const skills = skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const saved = await profileService.save({ ...profile!, skills });
      setProfile(saved);
      setSkillsText(saved.skills.join(", "));
      setSavedAt(saved.updatedAt);
      announce("Perfil salvo com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="perfil-title">
      <h2 id="perfil-title">Meu perfil</h2>
      <p className="cand-muted">
        Os campos marcados com <span aria-hidden="true">*</span> são
        obrigatórios. As informações de deficiência são opcionais e sigilosas.
      </p>

      <FormErrorSummary errors={errors} />

      {savedAt && (
        <p className="cand-success" role="status">
          Perfil salvo em {new Date(savedAt).toLocaleString("pt-BR")}.
        </p>
      )}

      {/* --- Dados profissionais (C1.1) --- */}
      <fieldset id="perfil-profissional" className="cand-fieldset">
        <legend>Dados profissionais</legend>

        <Field
          id="headline"
          label="Título profissional"
          hint="Como você se apresenta em uma linha."
          value={profile.headline}
          onChange={(e) => update("headline", e.target.value)}
          required
          error={errors.find((er) => er.fieldId === "headline")?.message}
        />

        <div className="field">
          <label className="field__label" htmlFor="bio">
            Resumo / bio
          </label>
          <textarea
            id="bio"
            className="field__input"
            rows={4}
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="experience">
            Experiência
          </label>
          <textarea
            id="experience"
            className="field__input"
            rows={4}
            value={profile.experience}
            onChange={(e) => update("experience", e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor="education">
            Formação
          </label>
          <textarea
            id="education"
            className="field__input"
            rows={3}
            value={profile.education}
            onChange={(e) => update("education", e.target.value)}
          />
        </div>

        <Field
          id="skills"
          label="Habilidades"
          hint="Separe por vírgulas (ex.: React, acessibilidade, Libras)."
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
        />

        <Field
          id="salary"
          label="Pretensão salarial"
          hint="Opcional."
          value={profile.salaryExpectation ?? ""}
          onChange={(e) => update("salaryExpectation", e.target.value)}
        />
      </fieldset>

      {/* --- Bloco sensível (C1.2 / NF2) --- */}
      <fieldset id="perfil-sensivel" className="cand-fieldset cand-fieldset--sensitive">
        <legend>Informações de acessibilidade (opcional e sigiloso)</legend>
        <p className="cand-muted">
          Estes dados são criptografados e só são compartilhados com empresas
          mediante seu consentimento no momento da candidatura.
        </p>

        <div className="field">
          <label className="field__label" htmlFor="disability">
            Tipo de deficiência
          </label>
          <select
            id="disability"
            className="field__input"
            value={profile.sensitive.disabilityType ?? ""}
            onChange={(e) =>
              updateSensitive(
                "disabilityType",
                (e.target.value as DisabilityType) || undefined,
              )
            }
          >
            <option value="">Prefiro não informar</option>
            {DISABILITIES.map((d) => (
              <option key={d} value={d}>
                {DISABILITY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="disability-note">
            Observação (opcional)
          </label>
          <textarea
            id="disability-note"
            className="field__input"
            rows={2}
            value={profile.sensitive.disabilityNote ?? ""}
            onChange={(e) => updateSensitive("disabilityNote", e.target.value)}
          />
        </div>

        <fieldset className="cand-features">
          <legend>Acomodações necessárias</legend>
          <div className="cand-checks">
            {FEATURES.map((f) => (
              <label key={f} className="cand-check">
                <input
                  type="checkbox"
                  checked={profile.sensitive.accommodations.includes(f)}
                  onChange={(e) => toggleAccommodation(f, e.target.checked)}
                />
                <span>{FEATURE_LABELS[f]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </fieldset>

      {/* --- Currículo (C1.3) --- */}
      <fieldset id="perfil-curriculo" className="cand-fieldset">
        <legend>Currículo</legend>
        <div className="field">
          <label className="field__label" htmlFor="curriculo">
            Anexar currículo (PDF, DOC ou DOCX)
          </label>
          <p id="curriculo-hint" className="field__hint">
            Prefira PDF com marcação (tags) para garantir leitura por tecnologia
            assistiva.
          </p>
          <input
            ref={fileInputRef}
            id="curriculo"
            className="field__input"
            type="file"
            accept={ACCEPTED_RESUME_EXTENSIONS}
            aria-describedby="curriculo-hint"
            onChange={handleResume}
          />
          {errors.find((er) => er.fieldId === "curriculo") && (
            <p className="field__error" role="alert">
              {errors.find((er) => er.fieldId === "curriculo")?.message}
            </p>
          )}
        </div>

        {profile.resume && (
          <p className="cand-resume" role="status">
            Anexado: <strong>{profile.resume.name}</strong> (
            {Math.round(profile.resume.size / 1024)} KB).{" "}
            <Button variant="ghost" onClick={removeResume}>
              Remover
            </Button>
          </p>
        )}
      </fieldset>

      {/* --- Visibilidade (C1.4) --- */}
      <fieldset id="perfil-visibilidade" className="cand-fieldset">
        <legend>Visibilidade do perfil</legend>
        {VISIBILITIES.map((v) => (
          <label key={v} className="cand-radio">
            <input
              type="radio"
              name="visibility"
              value={v}
              checked={profile.visibility === v}
              onChange={() => update("visibility", v)}
            />
            <span>{VISIBILITY_LABELS[v]}</span>
          </label>
        ))}
      </fieldset>

      <div className="cand-actions">
        <Button type="submit" disabled={saving}>
          {saving ? "Salvando…" : "Salvar perfil"}
        </Button>
      </div>
    </form>
  );
}

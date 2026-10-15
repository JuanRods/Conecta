import { useState, type FormEvent } from "react";
import { Modal } from "../components/Modal";
import { Button } from "../components/Button";
import { FormErrorSummary } from "../components/FormErrorSummary";
import { useAnnouncer } from "../accessibility/Announcer";
import { reportService } from "./reportService";
import {
  REPORT_REASON_LABELS,
  type ReportReason,
  type ReportTargetType,
} from "./types";

const REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

/**
 * Diálogo acessível de denúncia (C3). Reutilizável a partir da vaga, da empresa
 * ou de um perfil. Envia à fila de moderação com status PENDING.
 */
export function ReportDialog({
  isOpen,
  onClose,
  reporterId,
  targetType,
  targetId,
  targetLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
}) {
  const { announce } = useAnnouncer();
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function reset() {
    setReason("");
    setDetails("");
    setErrors([]);
    setDone(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) {
      setErrors([
        { fieldId: "report-reason", message: "Selecione um motivo." },
      ]);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      await reportService.submit({
        targetType,
        targetId,
        targetLabel,
        reporterId,
        reason,
        details,
      });
      setDone(true);
      announce(
        "Denúncia enviada à moderação. Obrigado por ajudar a manter a plataforma segura.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Denunciar: ${targetLabel}`}
    >
      {done ? (
        <div>
          <p role="status">
            Sua denúncia foi enviada à equipe de moderação e será analisada.
          </p>
          <div style={{ marginTop: "var(--space-4)" }}>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <FormErrorSummary errors={errors} />

          <fieldset className="field" style={{ border: 0, padding: 0 }}>
            <legend className="field__label">
              Motivo da denúncia{" "}
              <span className="field__required" aria-hidden="true">
                *
              </span>
              <span className="sr-only"> (obrigatório)</span>
            </legend>
            <div id="report-reason">
              {REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: "flex",
                    gap: "var(--space-2)",
                    alignItems: "center",
                    minHeight: "var(--touch-target)",
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  <span>{REPORT_REASON_LABELS[r]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label className="field__label" htmlFor="report-details">
              Detalhes (opcional)
            </label>
            <textarea
              id="report-details"
              className="field__input"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Descreva o que você observou."
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--space-3)",
              marginTop: "var(--space-4)",
            }}
          >
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enviando…" : "Enviar denúncia"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

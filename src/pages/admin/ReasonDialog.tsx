import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";

/**
 * Diálogo acessível para ações de moderação que exigem justificativa
 * (rejeitar vaga, recusar verificação, suspender conta) — M1.2/M1.3/M2.
 */
export function ReasonDialog({
  isOpen,
  title,
  label,
  confirmText,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  label: string;
  confirmText: string;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [busy, setBusy] = useState(false);

  function close() {
    setReason("");
    setErrors([]);
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setErrors([{ fieldId: "reason", message: "A justificativa é obrigatória." }]);
      return;
    }
    setErrors([]);
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title={title}>
      <form onSubmit={submit} noValidate>
        <FormErrorSummary errors={errors} />
        <div className="field">
          <label className="field__label" htmlFor="reason">
            {label}{" "}
            <span className="field__required" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </label>
          <textarea
            id="reason"
            className="field__input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={errors.length > 0 || undefined}
          />
        </div>
        <div className="form-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Processando…" : confirmText}
          </Button>
          <Button type="button" variant="ghost" onClick={close}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

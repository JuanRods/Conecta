import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./Field.css";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Texto de ajuda associado via aria-describedby. */
  hint?: ReactNode;
}

/**
 * Campo de formulário acessível (A3.2, A3.3):
 * - label sempre associado ao input (htmlFor/id).
 * - hint e error associados via aria-describedby.
 * - aria-invalid quando há erro; required anunciado.
 * - aceita um id explícito (para âncoras do resumo de erros) ou gera um.
 */
export function Field({
  label,
  error,
  hint,
  required,
  id: idProp,
  ...inputProps
}: FieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>

      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}

      <input
        id={id}
        className={`field__input ${error ? "field__input--error" : ""}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        required={required}
        {...inputProps}
      />

      {error && (
        <p id={errorId} className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

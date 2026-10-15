import { useEffect, useRef } from "react";
import "./FormErrorSummary.css";

/**
 * Resumo de erros no topo do formulário (A3.3):
 * - Recebe o foco ao aparecer, para que o leitor de tela anuncie os erros.
 * - Cada item é um link para o campo correspondente.
 */
export function FormErrorSummary({
  errors,
}: {
  errors: { fieldId?: string; message: string }[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) {
      ref.current?.focus();
    }
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      className="form-error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="form-error-title"
    >
      <h2 id="form-error-title" className="form-error-summary__title">
        Há {errors.length} {errors.length === 1 ? "erro" : "erros"} no
        formulário
      </h2>
      <ul>
        {errors.map((e, i) => (
          <li key={i}>
            {e.fieldId ? <a href={`#${e.fieldId}`}>{e.message}</a> : e.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

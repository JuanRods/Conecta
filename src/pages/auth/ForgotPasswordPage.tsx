import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../auth/authService";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import "./auth.css";

/** Recuperação de senha (P1.4). Resposta neutra para não revelar e-mails. */
export function ForgotPasswordPage() {
  const { announce } = useAnnouncer();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await authService.forgotPassword(email);
    setSubmitting(false);
    setSent(true);
    announce(
      "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.",
    );
  }

  return (
    <section className="auth" aria-labelledby="forgot-title">
      <h1 id="forgot-title" className="auth__title">
        Recuperar senha
      </h1>

      {sent ? (
        <div className="auth__card" role="status">
          <p>
            Se houver uma conta associada a <strong>{email}</strong>, você
            receberá um e-mail com instruções para redefinir sua senha.
          </p>
          <p>
            <Link to="/entrar">Voltar para entrar</Link>
          </p>
        </div>
      ) : (
        <>
          <p className="auth__lead">
            Informe seu e-mail e enviaremos instruções para redefinir sua senha.
          </p>
          <form className="auth__card" onSubmit={handleSubmit} noValidate>
            <Field
              id="forgot-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="auth__actions">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Enviando…" : "Enviar instruções"}
              </Button>
              <Link to="/entrar">Voltar</Link>
            </div>
          </form>
        </>
      )}
    </section>
  );
}

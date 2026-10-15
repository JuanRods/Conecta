import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, dashboardPathForRole } from "../../auth/AuthContext";
import { AuthError } from "../../auth/types";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";
import "./auth.css";

/** Tela de login acessível (P1.3, A3). */
export function LoginPage() {
  const { login } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { fieldId?: string; message: string }[] = [];
    if (!email.trim())
      found.push({ fieldId: "login-email", message: "Informe seu e-mail." });
    if (!password)
      found.push({ fieldId: "login-password", message: "Informe sua senha." });
    setErrors(found);
    if (found.length > 0) return;

    setSubmitting(true);
    try {
      const user = await login({ email, password });
      announce(`Bem-vindo(a), ${user.name}. Login realizado.`);
      navigate(from ?? dashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : "Não foi possível entrar. Tente novamente.";
      setErrors([{ message }]);
      announce(message, "assertive");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth" aria-labelledby="login-title">
      <h1 id="login-title" className="auth__title">
        Entrar
      </h1>
      <p className="auth__lead">
        Acesse sua conta de candidato, empresa ou administrador.
      </p>

      <form className="auth__card" onSubmit={handleSubmit} noValidate>
        <FormErrorSummary errors={errors} />

        <Field
          id="login-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={errors.find((e) => e.fieldId === "login-email")?.message}
        />
        <Field
          id="login-password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          error={errors.find((e) => e.fieldId === "login-password")?.message}
        />

        <div className="auth__actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </Button>
          <Link to="/recuperar-senha">Esqueci minha senha</Link>
        </div>
      </form>

      <div className="auth__links">
        <p>
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </section>
  );
}

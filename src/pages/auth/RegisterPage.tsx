import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, dashboardPathForRole } from "../../auth/AuthContext";
import { AuthError } from "../../auth/types";
import { passwordRules } from "../../auth/passwordPolicy";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Field } from "../../components/Field";
import { Button } from "../../components/Button";
import { FormErrorSummary } from "../../components/FormErrorSummary";
import "./auth.css";

type AccountType = "candidate" | "company";

/** Tela de cadastro acessível com escolha de tipo de conta e tour guiado (P1, A5). */
export function RegisterPage() {
  const { register } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();

  const [accountType, setAccountType] = useState<AccountType>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ fieldId?: string; message: string }[]>(
    [],
  );
  const [submitting, setSubmitting] = useState(false);


  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found: { fieldId?: string; message: string }[] = [];
    if (!name.trim())
      found.push({ fieldId: "register-name", message: "Informe seu nome." });
    if (!email.trim())
      found.push({ fieldId: "register-email", message: "Informe seu e-mail." });
    if (passwordRules.some((r) => !r.test(password))) {
      found.push({
        fieldId: "register-password",
        message: "A senha não atende a todos os requisitos de segurança.",
      });
    }
    setErrors(found);
    if (found.length > 0) return;

    setSubmitting(true);
    try {
      const user = await register({ name, email, password, accountType });
      announce(`Conta criada com sucesso. Bem-vindo(a), ${user.name}.`);
      navigate(dashboardPathForRole(user.role), { replace: true });
    } catch (err) {
      const message =
        err instanceof AuthError
          ? err.message
          : "Não foi possível criar a conta. Tente novamente.";
      setErrors([{ message }]);
      announce(message, "assertive");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth" aria-labelledby="register-title">
      <h1 id="register-title" className="auth__title">
        Criar conta
      </h1>
      <p className="auth__lead">
        Junte-se ao Conecta Inclusão como candidato ou empresa.
      </p>

      <form className="auth__card" onSubmit={handleSubmit} noValidate>
        <FormErrorSummary errors={errors} />

        <fieldset id="account-type-group" className="account-type">
          <legend className="account-type__legend">Tipo de conta</legend>
          <label className="account-type__option">
            <input
              type="radio"
              name="accountType"
              value="candidate"
              checked={accountType === "candidate"}
              onChange={() => setAccountType("candidate")}
            />
            <span>
              <strong>Candidato</strong>
              <span>Sou pessoa com deficiência procurando emprego.</span>
            </span>
          </label>
          <label className="account-type__option">
            <input
              type="radio"
              name="accountType"
              value="company"
              checked={accountType === "company"}
              onChange={() => setAccountType("company")}
            />
            <span>
              <strong>Empresa</strong>
              <span>Quero publicar vagas e encontrar talentos.</span>
            </span>
          </label>
        </fieldset>

        <Field
          id="register-name"
          label={
            accountType === "company"
              ? "Nome da empresa / responsável"
              : "Nome completo"
          }
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={errors.find((e) => e.fieldId === "register-name")?.message}
        />
        <Field
          id="register-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          error={errors.find((e) => e.fieldId === "register-email")?.message}
        />
        <Field
          id="register-password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          hint="Use uma senha forte seguindo os requisitos abaixo."
          error={errors.find((e) => e.fieldId === "register-password")?.message}
        />

        <ul className="password-rules" aria-label="Requisitos da senha">
          {passwordRules.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.id} data-met={met}>
                <span aria-hidden="true">{met ? "✓" : "○"}</span>
                <span>{rule.label}</span>
                <span className="sr-only">
                  {met ? " (atendido)" : " (pendente)"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="auth__actions">
          <Button id="register-submit" type="submit" disabled={submitting}>
            {submitting ? "Criando conta…" : "Criar conta"}
          </Button>
        </div>
      </form>

      <div className="auth__links">
        <p>
          Já tem conta? <Link to="/entrar">Entrar</Link>
        </p>
      </div>
    </section>
  );
}

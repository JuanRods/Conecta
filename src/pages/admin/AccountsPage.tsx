import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { authService } from "../../auth/authService";
import type { Role, User } from "../../auth/types";
import { moderationService } from "../../admin/moderationService";
import { ReasonDialog } from "./ReasonDialog";

const ROLE_LABELS: Record<Role, string> = {
  CANDIDATE: "Candidato",
  COMPANY: "Empresa",
  ADMIN: "Administrador",
};

/** Gestão de contas: suspender/reativar (M2.5). */
export function AccountsPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();
  const [users, setUsers] = useState<User[] | null>(null);
  const [toSuspend, setToSuspend] = useState<User | null>(null);

  const admin = user ? { id: user.id, name: user.name } : null;

  async function refresh() {
    setUsers(await authService.listUsers());
  }

  useEffect(() => {
    let active = true;
    authService.listUsers().then((list) => {
      if (active) setUsers(list);
    });
    return () => {
      active = false;
    };
  }, []);

  async function reactivate(target: User) {
    if (!admin) return;
    await moderationService.reactivateUser(admin, target.id, target.name);
    await refresh();
    announce(`Conta de ${target.name} reativada.`);
  }

  if (!users) return <p aria-live="polite">Carregando contas…</p>;

  return (
    <div>
      <h2>Contas</h2>
      <p className="text-muted">
        {users.length} {users.length === 1 ? "conta" : "contas"}. Contas
        suspensas têm o login bloqueado.
      </p>

      <ul className="card-list">
        {users.map((u) => {
          const suspended = u.status === "SUSPENDED";
          const isSelf = u.id === user?.id;
          return (
            <li key={u.id}>
              <article className="card card--row" aria-labelledby={`acc-${u.id}`}>
                <div>
                  <h3 id={`acc-${u.id}`} className="card__title">
                    {u.name}
                  </h3>
                  <p className="card__meta">
                    {u.email} · {ROLE_LABELS[u.role]} ·{" "}
                    <span
                      className={
                        "badge " + (suspended ? "badge--error" : "badge--success")
                      }
                    >
                      {suspended ? "Suspensa" : "Ativa"}
                    </span>
                  </p>
                </div>
                <div className="card__actions">
                  {suspended ? (
                    <Button variant="secondary" onClick={() => reactivate(u)}>
                      Reativar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setToSuspend(u)}
                      disabled={isSelf}
                      title={
                        isSelf ? "Você não pode suspender a própria conta." : undefined
                      }
                    >
                      Suspender
                    </Button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <ReasonDialog
        isOpen={toSuspend !== null}
        title={`Suspender conta: ${toSuspend?.name ?? ""}`}
        label="Motivo da suspensão (registrado na auditoria)"
        confirmText="Suspender conta"
        onClose={() => setToSuspend(null)}
        onConfirm={async (reason) => {
          if (admin && toSuspend) {
            await moderationService.suspendUser(
              admin,
              toSuspend.id,
              toSuspend.name,
              reason,
            );
            await refresh();
            announce(`Conta de ${toSuspend.name} suspensa.`);
          }
        }}
      />
    </div>
  );
}

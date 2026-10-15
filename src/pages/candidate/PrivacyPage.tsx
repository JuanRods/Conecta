import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useAnnouncer } from "../../accessibility/Announcer";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import {
  CONSENT_VERSION,
  privacyService,
  type ConsentRecord,
} from "../../privacy/privacyService";

/**
 * Central de Privacidade do candidato (Fase 7 — LGPD/NF2):
 * consentimento, exportação de dados (portabilidade) e exclusão da conta.
 */
export function PrivacyPage() {
  const { user, logout } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();

  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setConsent(privacyService.getConsent(user.id));
  }, [user]);

  if (!user) return null;

  async function giveConsent() {
    const record = await privacyService.recordConsent(user!.id);
    setConsent(record);
    announce("Consentimento registrado.");
  }

  async function revoke() {
    await privacyService.revokeConsent(user!.id);
    setConsent(null);
    announce("Consentimento revogado.");
  }

  async function exportData() {
    const data = await privacyService.exportCandidateData(user!);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conecta-meus-dados-${user!.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    announce("Seus dados foram exportados em formato JSON.");
  }

  async function deleteAccount() {
    setBusy(true);
    try {
      await privacyService.deleteCandidateAccount(user!.id);
      logout();
      announce("Sua conta e seus dados foram excluídos.", "assertive");
      navigate("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Privacidade e meus dados</h2>
      <p className="text-muted">
        Você controla seus dados pessoais conforme a LGPD: consentimento,
        exportação (portabilidade) e exclusão.
      </p>

      {/* --- Consentimento --- */}
      <section className="form-fieldset" aria-labelledby="consent-title">
        <h3 id="consent-title">Consentimento de tratamento de dados</h3>
        {consent ? (
          <>
            <p className="badge badge--success">
              Consentimento ativo (versão {consent.version})
            </p>
            <p className="text-muted">
              Aceito em {new Date(consent.acceptedAt).toLocaleString("pt-BR")}.
            </p>
            <div className="form-actions">
              <Button variant="ghost" onClick={revoke}>
                Revogar consentimento
              </Button>
            </div>
          </>
        ) : (
          <>
            <p>
              Autorizo o tratamento dos meus dados para fins de candidatura a
              vagas, incluindo o compartilhamento de acomodações apenas quando eu
              consentir, por candidatura. Versão {CONSENT_VERSION}.
            </p>
            <div className="form-actions">
              <Button onClick={giveConsent}>Dar consentimento</Button>
            </div>
          </>
        )}
      </section>

      {/* --- Portabilidade --- */}
      <section className="form-fieldset" aria-labelledby="export-title">
        <h3 id="export-title">Exportar meus dados</h3>
        <p className="text-muted">
          Baixe uma cópia de todos os seus dados (perfil, candidaturas,
          favoritos, alertas e denúncias) em formato JSON.
        </p>
        <div className="form-actions">
          <Button variant="secondary" onClick={exportData}>
            Exportar em JSON
          </Button>
        </div>
      </section>

      {/* --- Exclusão --- */}
      <section
        className="form-fieldset form-fieldset--sensitive"
        aria-labelledby="delete-title"
      >
        <h3 id="delete-title">Excluir minha conta</h3>
        <p className="text-muted">
          Esta ação é permanente: remove sua conta e todos os dados associados.
          Não pode ser desfeita.
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
            Excluir minha conta
          </Button>
        </div>
      </section>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Confirmar exclusão de conta"
      >
        <p>
          Tem certeza de que deseja <strong>excluir sua conta</strong> e todos os
          seus dados? Esta ação não pode ser desfeita.
        </p>
        <div className="form-actions">
          <Button variant="ghost" onClick={deleteAccount} disabled={busy}>
            {busy ? "Excluindo…" : "Sim, excluir tudo"}
          </Button>
          <Button onClick={() => setConfirmDelete(false)}>Cancelar</Button>
        </div>
      </Modal>
    </div>
  );
}

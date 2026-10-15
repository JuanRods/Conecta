import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGuidedTour } from "./GuidedTour";
import { useAnnouncer } from "./Announcer";
import { findTourForPath, type TourDefinition } from "./tours";
import "./TourLauncher.css";

/**
 * Lançador global da Navegação Guiada (A5).
 *
 * - Ícone flutuante fixo (como o VLibras), presente em TODAS as telas: abre o
 *   guia da tela atual a qualquer momento.
 * - Ao entrar em uma tela que tem guia, oferece um convite acessível com as
 *   opções "Iniciar", "Cancelar" e a caixa "Não exibir novamente".
 * - O convite não reaparece se o usuário pediu para não exibir mais, ou se já
 *   concluiu aquele guia; o ícone, porém, continua sempre disponível.
 */
export function TourLauncher() {
  const location = useLocation();
  const { startTour, isTourCompleted, suppressTour, isTourSuppressed } =
    useGuidedTour();
  const { announce } = useAnnouncer();

  const [tour, setTour] = useState<TourDefinition | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Evita reabrir o convite na mesma rota após o usuário decidir.
  const decidedRoutes = useRef<Set<string>>(new Set());

  // Esc fecha o convite sem precisar de foco preso (ele não é modal).
  useEffect(() => {
    if (!inviteOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeInvite();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteOpen, tour, dontAskAgain]);

  // Localiza o tour da rota atual e decide se o convite deve aparecer.
  useEffect(() => {
    const found = findTourForPath(location.pathname);
    setTour(found);
    setDontAskAgain(false);

    if (!found) {
      setInviteOpen(false);
      return;
    }
    const alreadyDecided = decidedRoutes.current.has(location.pathname);
    const shouldOffer =
      !alreadyDecided &&
      !isTourSuppressed(found.id) &&
      !isTourCompleted(found.id);

    setInviteOpen(shouldOffer);
    if (shouldOffer) {
      announce(
        `Navegação guiada disponível para a tela ${found.screen}. Um convite foi aberto.`,
      );
    }
  }, [location.pathname, isTourSuppressed, isTourCompleted, announce]);

  function persistPreference() {
    if (dontAskAgain && tour) suppressTour(tour.id);
  }

  function closeInvite() {
    persistPreference();
    if (tour) decidedRoutes.current.add(location.pathname);
    setInviteOpen(false);
    buttonRef.current?.focus();
  }

  function begin() {
    if (!tour) return;
    persistPreference();
    decidedRoutes.current.add(location.pathname);
    setInviteOpen(false);
    startTour({ id: tour.id, steps: tour.steps });
  }

  /** Clique no ícone: inicia o guia da tela atual (sempre disponível). */
  function handleIconClick() {
    if (!tour) {
      announce(
        "Esta tela ainda não possui navegação guiada. Use o menu para ir a outra seção.",
        "assertive",
      );
      return;
    }
    setInviteOpen(false);
    startTour({ id: tour.id, steps: tour.steps });
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="tour-fab"
        onClick={handleIconClick}
        aria-label={
          tour
            ? `Iniciar navegação guiada da tela ${tour.screen}`
            : "Navegação guiada (indisponível nesta tela)"
        }
        title="Navegação guiada"
      >
        <span className="tour-fab__icon" aria-hidden="true">
          🧭
        </span>
        <span className="tour-fab__text">Guia</span>
      </button>

      {inviteOpen && tour && (
        <>
          <div
            ref={panelRef}
            className="tour-invite"
            role="dialog"
            aria-labelledby="tour-invite-title"
            aria-describedby="tour-invite-desc"
          >
            <h2 id="tour-invite-title" className="tour-invite__title">
              Quer um guia desta tela?
            </h2>
            <p id="tour-invite-desc" className="tour-invite__desc">
              Podemos mostrar passo a passo como usar a tela{" "}
              <strong>{tour.screen}</strong>. São {tour.steps.length}{" "}
              {tour.steps.length === 1 ? "passo" : "passos"} e você pode sair
              quando quiser.
            </p>

            <label className="tour-invite__check">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
              />
              <span>Não exibir novamente</span>
            </label>

            <div className="tour-invite__actions">
              <button
                type="button"
                className="tour-invite__btn tour-invite__btn--primary"
                onClick={begin}
              >
                Iniciar navegação guiada
              </button>
              <button
                type="button"
                className="tour-invite__btn"
                onClick={closeInvite}
              >
                Cancelar
              </button>
            </div>

            <p className="tour-invite__hint">
              Você pode reabrir o guia a qualquer momento no ícone{" "}
              <span aria-hidden="true">🧭</span> “Guia”.
            </p>
          </div>
        </>
      )}
    </>
  );
}

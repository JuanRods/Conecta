import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFocusTrap } from "../accessibility/useFocusTrap";
import { Button } from "./Button";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal acessível (A1, A2, A3):
 * - role="dialog" + aria-modal, rotulado por aria-labelledby.
 * - Foco preso dentro do diálogo; Esc fecha; foco volta ao gatilho.
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";

  useFocusTrap(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal__overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Fechar janela"
            className="modal__close"
          >
            <span aria-hidden="true">×</span>
          </Button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

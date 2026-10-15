import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
}

/**
 * Botão acessível: alvo de toque >= 44px, foco visível herdado do global,
 * e suporte completo aos atributos nativos (aria-*, type, disabled...).
 */
export function Button({
  variant = "primary",
  children,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Tipos de domínio de autenticação e autorização (RBAC).
 * Alinhados ao modelo de dados do design (.kiro/specs/conecta-inclusao/design.md).
 */

export type Role = "CANDIDATE" | "COMPANY" | "ADMIN";

export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
}

/** Dados de registro — o tipo de conta define o papel inicial. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  accountType: "candidate" | "company";
}

export interface LoginInput {
  email: string;
  password: string;
}

/** Erro de autenticação com código estável para a UI tratar. */
export class AuthError extends Error {
  constructor(
    public code:
      | "EMAIL_IN_USE"
      | "INVALID_CREDENTIALS"
      | "ACCOUNT_SUSPENDED"
      | "NOT_FOUND"
      | "WEAK_PASSWORD"
      | "NETWORK"
      | "SERVER_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

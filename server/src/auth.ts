import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

/**
 * Segurança real da API (substitui o hash didático base64 e a ausência de JWT):
 *  - Senhas com **bcrypt** (hash + salt, custo configurável).
 *  - Sessão por **JWT** assinado (HS256), lido do header Authorization.
 *  - **RBAC** por middleware (requireAuth / requireRole).
 *
 * O segredo vem de JWT_SECRET (ver server/.env.example). Em produção, use um
 * segredo forte e, idealmente, rotação de chaves.
 */

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-conecta-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

export type Role = "CANDIDATE" | "COMPANY" | "ADMIN";

export interface TokenClaims {
  sub: string; // user id
  role: Role;
  name: string;
}

/** Gera o hash bcrypt de uma senha. */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(String(plain), BCRYPT_ROUNDS);
}

/**
 * Verifica a senha contra o hash armazenado. Compatível com contas antigas que
 * ainda usem o formato didático `hashed:<base64>` (migração suave): se o hash
 * não for bcrypt, cai no formato legado.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  if (stored.startsWith("$2")) {
    try {
      return bcrypt.compareSync(String(plain), stored);
    } catch {
      return false;
    }
  }
  // Legado: `hashed:<base64(plain)>`
  const legacy = `hashed:${Buffer.from(String(plain), "utf8").toString("base64")}`;
  return stored === legacy;
}

/** Assina um JWT para o usuário autenticado. */
export function signToken(claims: TokenClaims): string {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };
  return jwt.sign(claims, JWT_SECRET, options);
}

/** Decodifica/valida o token do header Authorization: Bearer <token>. */
export function readToken(req: Request): TokenClaims | null {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as TokenClaims;
  } catch {
    return null;
  }
}

// Anexa o usuário decodificado ao request (tipagem leve).
export interface AuthedRequest extends Request {
  auth?: TokenClaims;
}

/** Exige um token válido. */
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const claims = readToken(req);
  if (!claims) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Autenticação necessária." } });
    return;
  }
  req.auth = claims;
  next();
}

/** Exige um dos papéis informados (RBAC). Use após `requireAuth`. */
export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const claims = req.auth ?? readToken(req);
    if (!claims) {
      res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Autenticação necessária." } });
      return;
    }
    if (!roles.includes(claims.role)) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Acesso negado para o seu perfil." } });
      return;
    }
    req.auth = claims;
    next();
  };
}

import jwt from "jsonwebtoken";

export const JWT_SECRET =
  process.env.CONECTA_JWT_SECRET || "dev-only-jwt-secret-change-me";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

/** Lê o token do header Authorization: Bearer <token> (opcional). */
export function parseUser(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.sub, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

/** Exige autenticação. Opcionalmente, restringe a determinados papéis (RBAC). */
export function requireAuth(...roles) {
  return (req, res, next) => {
    const user = parseUser(req);
    if (!user) return res.status(401).json({ error: "Não autenticado." });
    if (roles.length > 0 && !roles.includes(user.role)) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    req.user = user;
    next();
  };
}

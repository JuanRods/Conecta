import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { toUser } from "../mappers.js";
import { signToken, requireAuth } from "../auth-middleware.js";

const router = Router();

const passwordRules = [
  (v) => v.length >= 8,
  (v) => /[a-zA-ZÀ-ÿ]/.test(v),
  (v) => /\d/.test(v),
  (v) => /[^a-zA-ZÀ-ÿ0-9]/.test(v),
];
const isStrongPassword = (v) => passwordRules.every((r) => r(v));

function sessionFor(userRow) {
  const user = toUser(userRow);
  return { token: signToken(user), user };
}

// POST /auth/register
router.post("/register", (req, res) => {
  const { name, email, password, accountType } = req.body || {};
  if (!name || !email || !password || !accountType) {
    return res.status(400).json({ code: "INVALID", error: "Dados incompletos." });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      code: "WEAK_PASSWORD",
      error: "A senha não atende aos requisitos de segurança.",
    });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);
  if (existing) {
    return res
      .status(409)
      .json({ code: "EMAIL_IN_USE", error: "Já existe uma conta com este e-mail." });
  }

  const role = accountType === "company" ? "COMPANY" : "CANDIDATE";
  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();

  db.prepare(
    `INSERT INTO users (id, name, email, role, status, password_hash, created_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
  ).run(id, String(name).trim(), normalizedEmail, role, passwordHash, createdAt);

  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  res.status(201).json(sessionFor(row));
});

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail);
  if (!row || !bcrypt.compareSync(String(password || ""), row.password_hash)) {
    return res
      .status(401)
      .json({ code: "INVALID_CREDENTIALS", error: "E-mail ou senha incorretos." });
  }
  if (row.status === "SUSPENDED") {
    return res.status(403).json({
      code: "ACCOUNT_SUSPENDED",
      error: "Esta conta está suspensa. Fale com o suporte.",
    });
  }
  res.json(sessionFor(row));
});

// POST /auth/forgot-password — resposta neutra (nunca revela se o e-mail existe)
router.post("/forgot-password", (_req, res) => {
  res.status(204).end();
});

// GET /auth/me — valida a sessão a partir do token
router.get("/me", requireAuth(), (req, res) => {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
  if (!row) return res.status(404).json({ error: "Conta não encontrada." });
  res.json(toUser(row));
});

// --- Administração de contas (RBAC: ADMIN) ---

// GET /users
router.get("/users", requireAuth("ADMIN"), (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY created_at").all();
  res.json(rows.map(toUser));
});

// PATCH /users/:id/status  { status: 'ACTIVE' | 'SUSPENDED' }
router.patch("/users/:id/status", requireAuth("ADMIN"), (req, res) => {
  const { status } = req.body || {};
  if (!["ACTIVE", "SUSPENDED"].includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ code: "NOT_FOUND", error: "Conta não encontrada." });
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(toUser({ ...row, status }));
});

// DELETE /users/:id — exclusão de conta (LGPD). Cascata remove dados ligados.
router.delete("/users/:id", requireAuth(), (req, res) => {
  // O próprio usuário ou um admin podem excluir a conta.
  if (req.user.role !== "ADMIN" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Acesso negado." });
  }
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

export default router;

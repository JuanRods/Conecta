import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { toReport } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

const router = Router();

// POST /reports — enviar denúncia (qualquer usuário autenticado)
router.post("/", requireAuth(), (req, res) => {
  const b = req.body || {};
  const id = randomUUID();
  db.prepare(
    `INSERT INTO reports (id, target_type, target_id, target_label, reporter_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
  ).run(
    id,
    b.targetType,
    b.targetId,
    b.targetLabel ?? "",
    req.user.id,
    b.reason,
    b.details?.trim() || null,
    new Date().toISOString(),
  );
  res.status(201).json(toReport(db.prepare("SELECT * FROM reports WHERE id = ?").get(id)));
});

// GET /reports/pending — fila de moderação (ADMIN)
router.get("/pending", requireAuth("ADMIN"), (_req, res) => {
  const rows = db.prepare("SELECT * FROM reports WHERE status = 'PENDING'").all();
  res.json(rows.map(toReport));
});

// PATCH /reports/:id/status — moderação (ADMIN)
router.patch("/:id/status", requireAuth("ADMIN"), (req, res) => {
  const { status } = req.body || {};
  if (!["PENDING", "REVIEWED", "ARCHIVED"].includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Denúncia não encontrada." });
  db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json(toReport(db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id)));
});

export default router;

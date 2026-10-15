import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { toAudit } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

/**
 * Moderação (Fase 6 — M1/M2). Orquestra ações sobre vagas, empresas, denúncias
 * e contas, registrando TODAS em um log de auditoria imutável (M1.4 / NF8) e
 * notificando os autores quando aplicável (M1.3). Cada ação roda numa transação.
 */

const router = Router();

function audit(admin, targetType, targetId, targetLabel, action, reason) {
  db.prepare(
    `INSERT INTO moderation_audit (id, admin_id, admin_name, target_type, target_id, target_label, action, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    randomUUID(),
    admin.id,
    admin.name,
    targetType,
    targetId,
    targetLabel,
    action,
    reason ?? null,
    new Date().toISOString(),
  );
}

function notifyModeration(userId, message) {
  db.prepare(
    "INSERT INTO notifications (user_id, kind, payload, created_at) VALUES (?, 'MODERATION', ?, ?)",
  ).run(userId, JSON.stringify({ type: "MODERATION", message, createdAt: new Date().toISOString() }), new Date().toISOString());
}

// GET /moderation/queue — contagens agregadas
router.get("/queue", requireAuth("ADMIN"), (_req, res) => {
  const jobs = db.prepare("SELECT COUNT(*) n FROM jobs WHERE status = 'PENDING'").get().n;
  const companies = db
    .prepare("SELECT COUNT(*) n FROM companies WHERE verification_status = 'PENDING'")
    .get().n;
  const reports = db.prepare("SELECT COUNT(*) n FROM reports WHERE status = 'PENDING'").get().n;
  res.json({ jobs, companies, reports });
});

// POST /moderation/jobs/:id/approve
router.post("/jobs/:id/approve", requireAuth("ADMIN"), (req, res) => {
  const run = db.transaction(() => {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!job) throw { status: 404, message: "Vaga não encontrada." };
    db.prepare("UPDATE jobs SET status = 'APPROVED', published_at = ? WHERE id = ?").run(
      new Date().toISOString(),
      req.params.id,
    );
    audit(req.user, "JOB", req.params.id, job.title, "APPROVE");
    notifyModeration(job.company_id, `Sua vaga "${job.title}" foi aprovada e publicada.`);
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/jobs/:id/reject  { reason, requestChanges }
router.post("/jobs/:id/reject", requireAuth("ADMIN"), (req, res) => {
  const { reason = "", requestChanges = false } = req.body || {};
  const run = db.transaction(() => {
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
    if (!job) throw { status: 404, message: "Vaga não encontrada." };
    db.prepare("UPDATE jobs SET status = 'REJECTED', published_at = NULL WHERE id = ?").run(req.params.id);
    audit(req.user, "JOB", req.params.id, job.title, requestChanges ? "REQUEST_CHANGES" : "REJECT", reason);
    notifyModeration(
      job.company_id,
      `Sua vaga "${job.title}" foi ${requestChanges ? "devolvida para ajustes" : "rejeitada"}. Motivo: ${reason}`,
    );
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/companies/:userId/verify
router.post("/companies/:userId/verify", requireAuth("ADMIN"), (req, res) => {
  const run = db.transaction(() => {
    const company = db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.params.userId);
    if (!company) throw { status: 404, message: "Empresa não encontrada." };
    db.prepare("UPDATE companies SET verification_status = 'VERIFIED', updated_at = ? WHERE user_id = ?").run(
      new Date().toISOString(),
      req.params.userId,
    );
    audit(req.user, "COMPANY", req.params.userId, company.name, "VERIFY");
    notifyModeration(req.params.userId, "Sua empresa foi verificada. Parabéns!");
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/companies/:userId/reject  { reason }
router.post("/companies/:userId/reject", requireAuth("ADMIN"), (req, res) => {
  const { reason = "" } = req.body || {};
  const run = db.transaction(() => {
    const company = db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.params.userId);
    if (!company) throw { status: 404, message: "Empresa não encontrada." };
    db.prepare("UPDATE companies SET verification_status = 'REJECTED', updated_at = ? WHERE user_id = ?").run(
      new Date().toISOString(),
      req.params.userId,
    );
    audit(req.user, "COMPANY", req.params.userId, company.name, "REJECT_VERIFICATION", reason);
    notifyModeration(req.params.userId, `A verificação da sua empresa foi recusada. Motivo: ${reason}`);
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/reports/:id/archive  { targetLabel }
router.post("/reports/:id/archive", requireAuth("ADMIN"), (req, res) => {
  const { targetLabel = "" } = req.body || {};
  const run = db.transaction(() => {
    const report = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
    if (!report) throw { status: 404, message: "Denúncia não encontrada." };
    db.prepare("UPDATE reports SET status = 'ARCHIVED' WHERE id = ?").run(req.params.id);
    audit(req.user, "REPORT", req.params.id, targetLabel || report.target_label, "ARCHIVE_REPORT");
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/users/:id/suspend  { userName, reason }
router.post("/users/:id/suspend", requireAuth("ADMIN"), (req, res) => {
  const { userName = "", reason = "" } = req.body || {};
  const run = db.transaction(() => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) throw { status: 404, message: "Conta não encontrada." };
    db.prepare("UPDATE users SET status = 'SUSPENDED' WHERE id = ?").run(req.params.id);
    audit(req.user, "USER", req.params.id, userName || user.name, "SUSPEND_USER", reason);
    notifyModeration(req.params.id, `Sua conta foi suspensa. Motivo: ${reason}`);
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// POST /moderation/users/:id/reactivate  { userName }
router.post("/users/:id/reactivate", requireAuth("ADMIN"), (req, res) => {
  const { userName = "" } = req.body || {};
  const run = db.transaction(() => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (!user) throw { status: 404, message: "Conta não encontrada." };
    db.prepare("UPDATE users SET status = 'ACTIVE' WHERE id = ?").run(req.params.id);
    audit(req.user, "USER", req.params.id, userName || user.name, "REACTIVATE_USER");
    notifyModeration(req.params.id, "Sua conta foi reativada.");
  });
  try {
    run();
    res.status(204).end();
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Erro." });
  }
});

// GET /moderation/audit — log de auditoria (ADMIN)
router.get("/audit", requireAuth("ADMIN"), (_req, res) => {
  const rows = db.prepare("SELECT * FROM moderation_audit ORDER BY created_at DESC").all();
  res.json(rows.map(toAudit));
});

// GET /moderation/notifications — notificações de moderação do usuário atual
router.get("/notifications", requireAuth(), (req, res) => {
  const rows = db
    .prepare("SELECT payload FROM notifications WHERE user_id = ? AND kind = 'MODERATION' ORDER BY id DESC")
    .all(req.user.id);
  res.json(rows.map((r) => JSON.parse(r.payload)));
});

export default router;

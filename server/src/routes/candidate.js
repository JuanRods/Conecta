import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { encryptSensitive } from "../crypto.js";
import { toProfile, toApplication, toFavorite, toAlert } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

const router = Router();

function emptyProfile(userId) {
  return {
    userId,
    headline: "",
    bio: "",
    skills: [],
    experience: "",
    education: "",
    salaryExpectation: "",
    visibility: "APPLIED_ONLY",
    sensitive: { accommodations: [] },
    updatedAt: new Date().toISOString(),
  };
}

function notify(userId, kind, payload) {
  db.prepare(
    "INSERT INTO notifications (user_id, kind, payload, created_at) VALUES (?, ?, ?, ?)",
  ).run(userId, kind, JSON.stringify(payload), new Date().toISOString());
}

// ============================= PERFIL (C1) =============================

// GET /candidate/profile — perfil do candidato autenticado (ou vazio)
router.get("/profile", requireAuth("CANDIDATE"), (req, res) => {
  const row = db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(req.user.id);
  res.json(row ? toProfile(row) : emptyProfile(req.user.id));
});

// GET /candidate/profile/exists
router.get("/profile/exists", requireAuth("CANDIDATE"), (req, res) => {
  const row = db.prepare("SELECT user_id FROM candidate_profiles WHERE user_id = ?").get(req.user.id);
  res.json({ exists: !!row });
});

// PUT /candidate/profile — salva (bloco sensível cifrado em repouso — NF2)
router.put("/profile", requireAuth("CANDIDATE"), (req, res) => {
  const p = req.body || {};
  const updatedAt = new Date().toISOString();
  const sensitiveEnc = encryptSensitive(p.sensitive ?? { accommodations: [] });
  db.prepare(
    `INSERT INTO candidate_profiles (user_id, headline, bio, skills, experience,
        education, salary_expectation, visibility, resume, sensitive_enc, updated_at)
     VALUES (@user_id, @headline, @bio, @skills, @experience, @education,
        @salary_expectation, @visibility, @resume, @sensitive_enc, @updated_at)
     ON CONFLICT(user_id) DO UPDATE SET
        headline=@headline, bio=@bio, skills=@skills, experience=@experience,
        education=@education, salary_expectation=@salary_expectation,
        visibility=@visibility, resume=@resume, sensitive_enc=@sensitive_enc,
        updated_at=@updated_at`,
  ).run({
    user_id: req.user.id,
    headline: p.headline ?? "",
    bio: p.bio ?? "",
    skills: JSON.stringify(p.skills ?? []),
    experience: p.experience ?? "",
    education: p.education ?? "",
    salary_expectation: p.salaryExpectation ?? "",
    visibility: p.visibility ?? "APPLIED_ONLY",
    resume: p.resume ? JSON.stringify(p.resume) : null,
    sensitive_enc: sensitiveEnc,
    updated_at: updatedAt,
  });
  res.json(toProfile(db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(req.user.id)));
});

// DELETE /candidate/profile — exclusão do perfil (LGPD)
router.delete("/profile", requireAuth("CANDIDATE"), (req, res) => {
  db.prepare("DELETE FROM candidate_profiles WHERE user_id = ?").run(req.user.id);
  res.status(204).end();
});

// ========================= CANDIDATURAS (C2) =========================

// GET /candidate/applications — minhas candidaturas
router.get("/applications", requireAuth("CANDIDATE"), (req, res) => {
  const rows = db
    .prepare("SELECT * FROM applications WHERE candidate_id = ? ORDER BY created_at DESC")
    .all(req.user.id);
  res.json(rows.map(toApplication));
});

// GET /candidate/applications/applied/:jobId — já me candidatei?
router.get("/applications/applied/:jobId", requireAuth("CANDIDATE"), (req, res) => {
  const row = db
    .prepare("SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?")
    .get(req.user.id, req.params.jobId);
  res.json({ applied: !!row });
});

// POST /candidate/applications — candidatar-se
router.post("/applications", requireAuth("CANDIDATE"), (req, res) => {
  const { job, sharedAccommodations } = req.body || {};
  if (!job?.id) return res.status(400).json({ error: "Vaga inválida." });
  const existing = db
    .prepare("SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?")
    .get(req.user.id, job.id);
  if (existing) {
    return res
      .status(409)
      .json({ code: "ALREADY_APPLIED", error: "Você já se candidatou a esta vaga." });
  }
  const id = randomUUID();
  const shared =
    Array.isArray(sharedAccommodations) && sharedAccommodations.length > 0
      ? JSON.stringify(sharedAccommodations)
      : null;
  db.prepare(
    `INSERT INTO applications (id, job_id, job_title, company_name, candidate_id, status, shared_accommodations, created_at)
     VALUES (?, ?, ?, ?, ?, 'SENT', ?, ?)`,
  ).run(id, job.id, job.title ?? "", job.companyName ?? "", req.user.id, shared, new Date().toISOString());
  res.status(201).json(toApplication(db.prepare("SELECT * FROM applications WHERE id = ?").get(id)));
});

// DELETE /candidate/applications/:id — retirar candidatura
router.delete("/applications/:id", requireAuth("CANDIDATE"), (req, res) => {
  db.prepare("DELETE FROM applications WHERE id = ? AND candidate_id = ?").run(
    req.params.id,
    req.user.id,
  );
  res.status(204).end();
});

// --- Visão da EMPRESA sobre candidaturas de uma vaga (E3) ---

// GET /candidate/applications/job/:jobId — candidaturas de uma vaga (COMPANY)
router.get("/applications/job/:jobId", requireAuth("COMPANY"), (req, res) => {
  const job = db
    .prepare("SELECT id FROM jobs WHERE id = ? AND company_id = ?")
    .get(req.params.jobId, req.user.id);
  if (!job) return res.status(403).json({ error: "Acesso negado." });
  const rows = db
    .prepare("SELECT * FROM applications WHERE job_id = ? ORDER BY created_at DESC")
    .all(req.params.jobId);
  res.json(rows.map(toApplication));
});

// PATCH /candidate/applications/:id/status — empresa atualiza status + notifica
router.patch("/applications/:id/status", requireAuth("COMPANY"), (req, res) => {
  const { status } = req.body || {};
  const row = db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Candidatura não encontrada." });
  const job = db
    .prepare("SELECT id FROM jobs WHERE id = ? AND company_id = ?")
    .get(row.job_id, req.user.id);
  if (!job) return res.status(403).json({ error: "Acesso negado." });
  db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, req.params.id);
  notify(row.candidate_id, "APPLICATION_STATUS", {
    type: "APPLICATION_STATUS",
    applicationId: req.params.id,
    jobTitle: row.job_title,
    status,
    createdAt: new Date().toISOString(),
  });
  res.json(toApplication(db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id)));
});

// GET /candidate/notifications — notificações do candidato (status de candidaturas)
router.get("/notifications", requireAuth("CANDIDATE"), (req, res) => {
  const rows = db
    .prepare("SELECT payload FROM notifications WHERE user_id = ? AND kind = 'APPLICATION_STATUS' ORDER BY id DESC")
    .all(req.user.id);
  res.json(rows.map((r) => JSON.parse(r.payload)));
});

// ========================= FAVORITOS (C2.4) =========================

router.get("/favorites", requireAuth("CANDIDATE"), (req, res) => {
  const rows = db.prepare("SELECT * FROM favorites WHERE candidate_id = ?").all(req.user.id);
  res.json(rows.map(toFavorite));
});

router.get("/favorites/:jobId", requireAuth("CANDIDATE"), (req, res) => {
  const row = db
    .prepare("SELECT job_id FROM favorites WHERE candidate_id = ? AND job_id = ?")
    .get(req.user.id, req.params.jobId);
  res.json({ favorite: !!row });
});

// POST /candidate/favorites/toggle { job } -> { favorite: boolean }
router.post("/favorites/toggle", requireAuth("CANDIDATE"), (req, res) => {
  const { job } = req.body || {};
  if (!job?.id) return res.status(400).json({ error: "Vaga inválida." });
  const existing = db
    .prepare("SELECT job_id FROM favorites WHERE candidate_id = ? AND job_id = ?")
    .get(req.user.id, job.id);
  if (existing) {
    db.prepare("DELETE FROM favorites WHERE candidate_id = ? AND job_id = ?").run(
      req.user.id,
      job.id,
    );
    return res.json({ favorite: false });
  }
  db.prepare(
    "INSERT INTO favorites (candidate_id, job_id, job_title, company_name, saved_at) VALUES (?, ?, ?, ?, ?)",
  ).run(req.user.id, job.id, job.title ?? "", job.companyName ?? "", new Date().toISOString());
  res.json({ favorite: true });
});

// ========================= ALERTAS (C2.4) =========================

router.get("/alerts", requireAuth("CANDIDATE"), (req, res) => {
  const rows = db.prepare("SELECT * FROM job_alerts WHERE candidate_id = ?").all(req.user.id);
  res.json(rows.map(toAlert));
});

router.post("/alerts", requireAuth("CANDIDATE"), (req, res) => {
  const { keyword, area } = req.body || {};
  const id = randomUUID();
  db.prepare(
    "INSERT INTO job_alerts (id, candidate_id, keyword, area, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    id,
    req.user.id,
    keyword?.trim() || null,
    area?.trim() || null,
    new Date().toISOString(),
  );
  res.status(201).json(toAlert(db.prepare("SELECT * FROM job_alerts WHERE id = ?").get(id)));
});

router.delete("/alerts/:id", requireAuth("CANDIDATE"), (req, res) => {
  db.prepare("DELETE FROM job_alerts WHERE id = ? AND candidate_id = ?").run(
    req.params.id,
    req.user.id,
  );
  res.status(204).end();
});

export default router;

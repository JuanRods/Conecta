import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import { toJob } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

const router = Router();

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesFilters(job, f) {
  if (f.keyword) {
    const q = normalize(f.keyword);
    const haystack = normalize(
      `${job.title} ${job.description} ${job.companyName} ${job.area}`,
    );
    if (!haystack.includes(q)) return false;
  }
  if (f.location && !normalize(job.location).includes(normalize(f.location)))
    return false;
  if (f.modality && job.modality !== f.modality) return false;
  if (f.level && job.level !== f.level) return false;
  if (f.area && normalize(job.area) !== normalize(f.area)) return false;
  if (f.features && f.features.length > 0) {
    const owned = new Set(job.accessibilityFeatures);
    if (!f.features.every((x) => owned.has(x))) return false;
  }
  return true;
}

function allJobs() {
  return db.prepare("SELECT * FROM jobs").all().map(toJob);
}

// GET /jobs — busca pública (apenas APPROVED). Filtros via querystring.
router.get("/", (req, res) => {
  const features = req.query.features
    ? String(req.query.features).split(",").filter(Boolean)
    : undefined;
  const filters = {
    keyword: req.query.keyword,
    location: req.query.location,
    modality: req.query.modality,
    level: req.query.level,
    area: req.query.area,
    features,
  };
  const results = allJobs()
    .filter((j) => j.status === "APPROVED")
    .filter((j) => matchesFilters(j, filters))
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
    );
  res.json(results);
});

// GET /jobs/areas — áreas distintas das vagas aprovadas
router.get("/areas", (_req, res) => {
  const areas = [
    ...new Set(
      allJobs()
        .filter((j) => j.status === "APPROVED")
        .map((j) => j.area),
    ),
  ].sort((a, b) => a.localeCompare(b));
  res.json(areas);
});

// GET /jobs/pending — fila de moderação (ADMIN)
router.get("/pending", requireAuth("ADMIN"), (_req, res) => {
  const pending = allJobs()
    .filter((j) => j.status === "PENDING")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json(pending);
});

// GET /jobs/mine — vagas da empresa autenticada (qualquer status)
router.get("/mine", requireAuth("COMPANY"), (req, res) => {
  const jobs = db
    .prepare("SELECT * FROM jobs WHERE company_id = ? ORDER BY created_at DESC")
    .all(req.user.id)
    .map(toJob);
  res.json(jobs);
});

// GET /jobs/mine/:id — detalhe de uma vaga da empresa (independe do status)
router.get("/mine/:id", requireAuth("COMPANY"), (req, res) => {
  const row = db
    .prepare("SELECT * FROM jobs WHERE id = ? AND company_id = ?")
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: "Vaga não encontrada." });
  res.json(toJob(row));
});

// GET /jobs/:id — detalhe público (só APPROVED)
router.get("/:id", (req, res) => {
  const row = db
    .prepare("SELECT * FROM jobs WHERE id = ? AND status = 'APPROVED'")
    .get(req.params.id);
  if (!row) return res.status(404).json(null);
  res.json(toJob(row));
});

// POST /jobs — cria vaga em moderação (COMPANY)
router.post("/", requireAuth("COMPANY"), (req, res) => {
  const b = req.body || {};
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO jobs (id, company_id, company_name, title, description, location,
       modality, level, area, accessibility_features, status, created_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NULL)`,
  ).run(
    id,
    req.user.id,
    b.companyName ?? "",
    b.title ?? "",
    b.description ?? "",
    b.location ?? "",
    b.modality,
    b.level,
    b.area ?? "",
    JSON.stringify(b.accessibilityFeatures ?? []),
    createdAt,
  );
  res.status(201).json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(id)));
});

// PATCH /jobs/mine/:id — edita vaga; APPROVED/REJECTED voltam a PENDING
router.patch("/mine/:id", requireAuth("COMPANY"), (req, res) => {
  const current = db
    .prepare("SELECT * FROM jobs WHERE id = ? AND company_id = ?")
    .get(req.params.id, req.user.id);
  if (!current) return res.status(404).json({ error: "Vaga não encontrada." });
  const job = toJob(current);
  const patch = req.body || {};
  const resetToModeration = job.status === "APPROVED" || job.status === "REJECTED";
  const merged = { ...job, ...patch };
  db.prepare(
    `UPDATE jobs SET title=?, description=?, location=?, modality=?, level=?,
       area=?, accessibility_features=?, company_name=?, status=?, published_at=?
     WHERE id = ? AND company_id = ?`,
  ).run(
    merged.title,
    merged.description,
    merged.location,
    merged.modality,
    merged.level,
    merged.area,
    JSON.stringify(merged.accessibilityFeatures ?? []),
    merged.companyName,
    resetToModeration ? "PENDING" : job.status,
    resetToModeration ? null : job.publishedAt ?? null,
    req.params.id,
    req.user.id,
  );
  res.json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id)));
});

// PATCH /jobs/mine/:id/status — pausar/encerrar/reabrir (COMPANY)
router.patch("/mine/:id/status", requireAuth("COMPANY"), (req, res) => {
  const { status } = req.body || {};
  const current = db
    .prepare("SELECT id FROM jobs WHERE id = ? AND company_id = ?")
    .get(req.params.id, req.user.id);
  if (!current) return res.status(404).json({ error: "Vaga não encontrada." });
  db.prepare("UPDATE jobs SET status = ? WHERE id = ? AND company_id = ?").run(
    status,
    req.params.id,
    req.user.id,
  );
  res.json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id)));
});

// POST /jobs/mine/:id/duplicate — duplica como rascunho (COMPANY)
router.post("/mine/:id/duplicate", requireAuth("COMPANY"), (req, res) => {
  const src = db
    .prepare("SELECT * FROM jobs WHERE id = ? AND company_id = ?")
    .get(req.params.id, req.user.id);
  if (!src) return res.status(404).json({ error: "Vaga não encontrada." });
  const id = randomUUID();
  db.prepare(
    `INSERT INTO jobs (id, company_id, company_name, title, description, location,
       modality, level, area, accessibility_features, status, created_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, NULL)`,
  ).run(
    id,
    src.company_id,
    src.company_name,
    `${src.title} (cópia)`,
    src.description,
    src.location,
    src.modality,
    src.level,
    src.area,
    src.accessibility_features,
    new Date().toISOString(),
  );
  res.status(201).json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(id)));
});

// DELETE /jobs/mine/:id — remove vaga (COMPANY)
router.delete("/mine/:id", requireAuth("COMPANY"), (req, res) => {
  db.prepare("DELETE FROM jobs WHERE id = ? AND company_id = ?").run(
    req.params.id,
    req.user.id,
  );
  res.status(204).end();
});

// --- Moderação (ADMIN) ---

// POST /jobs/:id/approve
router.post("/:id/approve", requireAuth("ADMIN"), (req, res) => {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Vaga não encontrada." });
  db.prepare(
    "UPDATE jobs SET status = 'APPROVED', published_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), req.params.id);
  res.json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id)));
});

// POST /jobs/:id/reject
router.post("/:id/reject", requireAuth("ADMIN"), (req, res) => {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Vaga não encontrada." });
  db.prepare(
    "UPDATE jobs SET status = 'REJECTED', published_at = NULL WHERE id = ?",
  ).run(req.params.id);
  res.json(toJob(db.prepare("SELECT * FROM jobs WHERE id = ?").get(req.params.id)));
});

export default router;

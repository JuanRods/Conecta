import { Router } from "express";
import { db } from "../db.js";
import { toCompany } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

const router = Router();

function emptyCompany(userId) {
  return {
    userId,
    name: "",
    cnpj: "",
    sector: "",
    description: "",
    inclusionPolicy: "",
    accessibilityFeatures: [],
    website: "",
    verificationStatus: "PENDING",
    updatedAt: new Date().toISOString(),
  };
}

// GET /companies/pending — empresas aguardando verificação (ADMIN)
router.get("/pending", requireAuth("ADMIN"), (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM companies WHERE verification_status = 'PENDING'")
    .all();
  res.json(rows.map(toCompany));
});

// GET /companies/me — perfil da empresa autenticada (ou vazio)
router.get("/me", requireAuth("COMPANY"), (req, res) => {
  const row = db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.user.id);
  res.json(row ? toCompany(row) : emptyCompany(req.user.id));
});

// GET /companies/me/exists
router.get("/me/exists", requireAuth("COMPANY"), (req, res) => {
  const row = db.prepare("SELECT user_id FROM companies WHERE user_id = ?").get(req.user.id);
  res.json({ exists: !!row });
});

// PUT /companies/me — cria/atualiza (status PENDING ao criar; mantém ao editar)
router.put("/me", requireAuth("COMPANY"), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.user.id);
  const verificationStatus =
    existing?.verification_status ?? b.verificationStatus ?? "PENDING";
  const updatedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO companies (user_id, name, cnpj, sector, description, inclusion_policy,
        accessibility_features, website, verification_status, updated_at)
     VALUES (@user_id, @name, @cnpj, @sector, @description, @inclusion_policy,
        @accessibility_features, @website, @verification_status, @updated_at)
     ON CONFLICT(user_id) DO UPDATE SET
        name=@name, cnpj=@cnpj, sector=@sector, description=@description,
        inclusion_policy=@inclusion_policy, accessibility_features=@accessibility_features,
        website=@website, verification_status=@verification_status, updated_at=@updated_at`,
  ).run({
    user_id: req.user.id,
    name: b.name ?? "",
    cnpj: b.cnpj ?? "",
    sector: b.sector ?? "",
    description: b.description ?? "",
    inclusion_policy: b.inclusionPolicy ?? "",
    accessibility_features: JSON.stringify(b.accessibilityFeatures ?? []),
    website: b.website ?? "",
    verification_status: verificationStatus,
    updated_at: updatedAt,
  });
  res.json(toCompany(db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.user.id)));
});

// PATCH /companies/:userId/verification — moderação (ADMIN)
router.patch("/:userId/verification", requireAuth("ADMIN"), (req, res) => {
  const { status } = req.body || {};
  if (!["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }
  const row = db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.params.userId);
  if (!row) return res.status(404).json({ error: "Empresa não encontrada." });
  db.prepare(
    "UPDATE companies SET verification_status = ?, updated_at = ? WHERE user_id = ?",
  ).run(status, new Date().toISOString(), req.params.userId);
  res.json(toCompany(db.prepare("SELECT * FROM companies WHERE user_id = ?").get(req.params.userId)));
});

export default router;

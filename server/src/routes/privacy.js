import { Router } from "express";
import { db } from "../db.js";
import { toUser, toProfile, toApplication, toFavorite, toAlert, toReport } from "../mappers.js";
import { requireAuth } from "../auth-middleware.js";

/**
 * Privacidade / LGPD (Fase 7 — NF2): consentimento versionado, portabilidade
 * (exportação JSON) e direito à exclusão (remoção da conta e de todos os dados).
 */

const router = Router();

export const CONSENT_VERSION = "2026-10-15";

// GET /privacy/consent — estado do consentimento do usuário atual
router.get("/consent", requireAuth(), (req, res) => {
  const row = db.prepare("SELECT * FROM privacy_consents WHERE user_id = ?").get(req.user.id);
  const consent =
    row && row.version === CONSENT_VERSION
      ? { userId: row.user_id, version: row.version, acceptedAt: row.accepted_at }
      : null;
  res.json({ version: CONSENT_VERSION, consented: !!consent, consent });
});

// POST /privacy/consent — registra consentimento da versão atual
router.post("/consent", requireAuth(), (req, res) => {
  const acceptedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO privacy_consents (user_id, version, accepted_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET version = excluded.version, accepted_at = excluded.accepted_at`,
  ).run(req.user.id, CONSENT_VERSION, acceptedAt);
  res.json({ userId: req.user.id, version: CONSENT_VERSION, acceptedAt });
});

// DELETE /privacy/consent — revoga consentimento
router.delete("/consent", requireAuth(), (req, res) => {
  db.prepare("DELETE FROM privacy_consents WHERE user_id = ?").run(req.user.id);
  res.status(204).end();
});

// GET /privacy/export — exporta TODOS os dados do candidato (portabilidade)
router.get("/export", requireAuth("CANDIDATE"), (req, res) => {
  const id = req.user.id;
  const account = toUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
  const consentRow = db.prepare("SELECT * FROM privacy_consents WHERE user_id = ?").get(id);
  const profileRow = db.prepare("SELECT * FROM candidate_profiles WHERE user_id = ?").get(id);
  res.json({
    exportedAt: new Date().toISOString(),
    account,
    consent:
      consentRow && consentRow.version === CONSENT_VERSION
        ? { userId: consentRow.user_id, version: consentRow.version, acceptedAt: consentRow.accepted_at }
        : null,
    profile: profileRow ? toProfile(profileRow) : null,
    applications: db
      .prepare("SELECT * FROM applications WHERE candidate_id = ? ORDER BY created_at DESC")
      .all(id)
      .map(toApplication),
    favorites: db.prepare("SELECT * FROM favorites WHERE candidate_id = ?").all(id).map(toFavorite),
    alerts: db.prepare("SELECT * FROM job_alerts WHERE candidate_id = ?").all(id).map(toAlert),
    notifications: db
      .prepare("SELECT payload FROM notifications WHERE user_id = ? AND kind = 'APPLICATION_STATUS' ORDER BY id DESC")
      .all(id)
      .map((r) => JSON.parse(r.payload)),
    reports: db.prepare("SELECT * FROM reports WHERE reporter_id = ?").all(id).map(toReport),
  });
});

// DELETE /privacy/account — exclusão completa da conta do candidato (LGPD)
router.delete("/account", requireAuth("CANDIDATE"), (req, res) => {
  const id = req.user.id;
  const run = db.transaction(() => {
    db.prepare("DELETE FROM candidate_profiles WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM applications WHERE candidate_id = ?").run(id);
    db.prepare("DELETE FROM favorites WHERE candidate_id = ?").run(id);
    db.prepare("DELETE FROM job_alerts WHERE candidate_id = ?").run(id);
    db.prepare("DELETE FROM notifications WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM reports WHERE reporter_id = ?").run(id);
    db.prepare("DELETE FROM privacy_consents WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  });
  run();
  res.status(204).end();
});

export default router;

import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../auth-middleware.js";

const router = Router();

// GET /metrics — métricas agregadas da plataforma (ADMIN)
router.get("/", requireAuth("ADMIN"), (_req, res) => {
  const users = db.prepare("SELECT role, status FROM users").all();
  const total = users.length;
  const candidates = users.filter((u) => u.role === "CANDIDATE").length;
  const companies = users.filter((u) => u.role === "COMPANY").length;
  const suspended = users.filter((u) => u.status === "SUSPENDED").length;

  const jobsByStatus = { DRAFT: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, PAUSED: 0, CLOSED: 0 };
  for (const r of db.prepare("SELECT status, COUNT(*) n FROM jobs GROUP BY status").all()) {
    if (r.status in jobsByStatus) jobsByStatus[r.status] = r.n;
  }

  const companiesTotal = db.prepare("SELECT COUNT(*) n FROM companies").get().n;
  const verified = db
    .prepare("SELECT COUNT(*) n FROM companies WHERE verification_status = 'VERIFIED'")
    .get().n;
  const pending = db
    .prepare("SELECT COUNT(*) n FROM companies WHERE verification_status = 'PENDING'")
    .get().n;
  const pendingReports = db
    .prepare("SELECT COUNT(*) n FROM reports WHERE status = 'PENDING'")
    .get().n;

  res.json({
    users: { total, candidates, companies, suspended },
    jobsByStatus,
    companies: { total: companiesTotal, verified, pending },
    reports: { pending: pendingReports },
  });
});

export default router;

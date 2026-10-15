import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import { query, queryOne, withTransaction, type Tx } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireRole,
  type Role,
} from "./auth.js";
import {
  toApplication,
  toCompany,
  toJob,
  toModerationAction,
  toReport,
  toUser,
  type JobRow,
} from "./mappers.js";

/**
 * API REST do Conecta Inclusão (endpoints do design §4).
 *
 * Segurança: senhas com **bcrypt**, sessão por **JWT** e **RBAC** por middleware
 * (ver auth.ts). As rotas administrativas exigem o papel ADMIN; as de empresa,
 * COMPANY. As regras de negócio sensíveis (só vagas APPROVED no público;
 * acomodações apenas com consentimento) são aplicadas aqui, no servidor.
 */

/** SELECT base de vagas, já com o nome da empresa resolvido. */
const JOB_SELECT = `
  SELECT j.*, c.name AS company_name
  FROM jobs j
  JOIN companies c ON c.user_id = j.company_id
`;

export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  const ok = (res: Response, data: unknown) => res.json(data);
  const fail = (res: Response, status: number, code: string, message: string) =>
    res.status(status).json({ error: { code, message } });

  // -------------------------------- Saúde ---------------------------------
  app.get("/health", async (_req, res) => {
    const row = await queryOne<{ now: Date }>("SELECT now() AS now");
    ok(res, { status: "ok", time: row?.now });
  });

  // ----------------------------- Autenticação -----------------------------

  app.post("/auth/register", async (req: Request, res: Response) => {
    const { name, email, password, accountType } = req.body ?? {};
    if (!name || !email || !password) {
      return fail(res, 400, "INVALID_INPUT", "Dados incompletos.");
    }
    const normalized = String(email).trim().toLowerCase();
    const exists = await queryOne("SELECT 1 FROM users WHERE email = $1", [
      normalized,
    ]);
    if (exists) {
      return fail(res, 409, "EMAIL_IN_USE", "Já existe uma conta com este e-mail.");
    }
    const role: Role = accountType === "company" ? "COMPANY" : "CANDIDATE";
    const row = await queryOne<{
      id: string; name: string; email: string; role: string;
      status: string; created_at: Date;
    }>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4::user_role)
       RETURNING id, name, email, role, status, created_at`,
      [String(name).trim(), normalized, hashPassword(password), role],
    );
    const user = toUser(row as never);
    ok(res, { token: signToken({ sub: user.id, role: user.role as Role, name: user.name }), user });
  });

  app.post("/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    const normalized = String(email ?? "").trim().toLowerCase();
    const row = await queryOne<{
      id: string; name: string; email: string; role: string;
      status: string; created_at: Date; password_hash: string;
    }>("SELECT * FROM users WHERE email = $1", [normalized]);

    if (!row || !verifyPassword(password, row.password_hash)) {
      return fail(res, 401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    }
    if (row.status === "SUSPENDED") {
      return fail(res, 403, "ACCOUNT_SUSPENDED", "Esta conta está suspensa. Fale com o suporte.");
    }
    const user = toUser(row);
    ok(res, { token: signToken({ sub: user.id, role: user.role as Role, name: user.name }), user });
  });

  // ------------------------- Vagas (busca pública) -------------------------

  app.get("/jobs", async (req: Request, res: Response) => {
    const { q, local, modalidade, nivel, area } = req.query;
    const features = toArray(req.query.feature);

    const where: string[] = ["j.status = 'APPROVED'"];
    const params: unknown[] = [];

    if (q) {
      params.push(`%${String(q)}%`);
      // unaccent não é garantido; usamos ILIKE sobre os campos textuais
      where.push(
        `(j.title ILIKE $${params.length} OR j.description ILIKE $${params.length}
          OR c.name ILIKE $${params.length} OR j.area ILIKE $${params.length})`,
      );
    }
    if (local) {
      params.push(`%${String(local)}%`);
      where.push(`j.location ILIKE $${params.length}`);
    }
    if (modalidade) {
      params.push(String(modalidade));
      where.push(`j.modality = $${params.length}::job_modality`);
    }
    if (nivel) {
      params.push(String(nivel));
      where.push(`j.level = $${params.length}::job_level`);
    }
    if (area) {
      params.push(String(area));
      where.push(`lower(j.area) = lower($${params.length})`);
    }
    if (features.length > 0) {
      params.push(features);
      // "contém todos" os recursos marcados
      where.push(`j.accessibility_features @> $${params.length}::text[]`);
    }

    const rows = await query<JobRow>(
      `${JOB_SELECT} WHERE ${where.join(" AND ")}
       ORDER BY COALESCE(j.published_at, j.created_at) DESC`,
      params,
    );
    ok(res, rows.map(toJob));
  });

  app.get("/jobs/areas", async (_req, res) => {
    const rows = await query<{ area: string }>(
      "SELECT DISTINCT area FROM jobs WHERE status = 'APPROVED' ORDER BY area",
    );
    ok(res, rows.map((r) => r.area));
  });

  app.get("/jobs/:id", async (req: Request, res: Response) => {
    const row = await queryOne<JobRow>(
      `${JOB_SELECT} WHERE j.id = $1 AND j.status = 'APPROVED'`,
      [req.params.id],
    );
    if (!row) return fail(res, 404, "NOT_FOUND", "Vaga não encontrada ou indisponível.");
    ok(res, toJob(row));
  });

  // --------------------------- Vagas (empresa) ----------------------------

  app.get("/companies/:companyId/jobs", async (req, res) => {
    const rows = await query<JobRow>(
      `${JOB_SELECT} WHERE j.company_id = $1 ORDER BY j.created_at DESC`,
      [req.params.companyId],
    );
    ok(res, rows.map(toJob));
  });

  app.post("/jobs", async (req: Request, res: Response) => {
    const j = req.body ?? {};
    if (!j.companyId || !j.title || !j.description || !j.area) {
      return fail(res, 400, "INVALID_INPUT", "Dados da vaga incompletos.");
    }
    // E2.3 / M1: toda vaga nasce em moderação
    const row = await queryOne<JobRow>(
      `WITH inserted AS (
         INSERT INTO jobs (company_id, title, description, location, modality, level, area, accessibility_features, status)
         VALUES ($1, $2, $3, $4, $5::job_modality, $6::job_level, $7, $8::text[], 'PENDING')
         RETURNING *
       )
       SELECT i.*, c.name AS company_name FROM inserted i
       JOIN companies c ON c.user_id = i.company_id`,
      [
        j.companyId, j.title, j.description, j.location ?? "",
        j.modality ?? "REMOTE", j.level ?? "MID", j.area,
        j.accessibilityFeatures ?? [],
      ],
    );
    ok(res, toJob(row as JobRow));
  });

  app.patch("/jobs/:id", async (req: Request, res: Response) => {
    const { companyId, ...patch } = req.body ?? {};
    const current = await queryOne<{ status: string }>(
      "SELECT status FROM jobs WHERE id = $1 AND company_id = $2",
      [req.params.id, companyId],
    );
    if (!current) return fail(res, 404, "NOT_FOUND", "Vaga não encontrada.");

    // Edição de vaga publicada/rejeitada volta à moderação
    const back = current.status === "APPROVED" || current.status === "REJECTED";
    const row = await queryOne<JobRow>(
      `WITH updated AS (
         UPDATE jobs SET
           title = COALESCE($3, title),
           description = COALESCE($4, description),
           location = COALESCE($5, location),
           modality = COALESCE($6::job_modality, modality),
           level = COALESCE($7::job_level, level),
           area = COALESCE($8, area),
           accessibility_features = COALESCE($9::text[], accessibility_features),
           status = CASE WHEN $10 THEN 'PENDING'::job_status ELSE status END,
           published_at = CASE WHEN $10 THEN NULL ELSE published_at END
         WHERE id = $1 AND company_id = $2
         RETURNING *
       )
       SELECT u.*, c.name AS company_name FROM updated u
       JOIN companies c ON c.user_id = u.company_id`,
      [
        req.params.id, companyId, patch.title ?? null, patch.description ?? null,
        patch.location ?? null, patch.modality ?? null, patch.level ?? null,
        patch.area ?? null, patch.accessibilityFeatures ?? null, back,
      ],
    );
    ok(res, toJob(row as JobRow));
  });

  app.patch("/jobs/:id/status", async (req: Request, res: Response) => {
    const { companyId, status } = req.body ?? {};
    const row = await queryOne<JobRow>(
      `WITH updated AS (
         UPDATE jobs SET status = $3::job_status
         WHERE id = $1 AND company_id = $2 RETURNING *
       )
       SELECT u.*, c.name AS company_name FROM updated u
       JOIN companies c ON c.user_id = u.company_id`,
      [req.params.id, companyId, status],
    );
    if (!row) return fail(res, 404, "NOT_FOUND", "Vaga não encontrada.");
    ok(res, toJob(row));
  });

  // ----------------------------- Candidaturas -----------------------------

  app.get("/candidates/:candidateId/applications", async (req, res) => {
    const rows = await query(
      `SELECT a.*, j.title AS job_title, c.name AS company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.user_id = j.company_id
       WHERE a.candidate_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.candidateId],
    );
    ok(res, rows.map((r) => toApplication(r as never)));
  });

  app.get("/jobs/:jobId/applications", async (req, res) => {
    const rows = await query(
      `SELECT a.*, j.title AS job_title, c.name AS company_name
       FROM applications a
       JOIN jobs j ON j.id = a.job_id
       JOIN companies c ON c.user_id = j.company_id
       WHERE a.job_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.jobId],
    );
    ok(res, rows.map((r) => toApplication(r as never)));
  });

  app.post("/applications", async (req: Request, res: Response) => {
    const { candidateId, jobId, sharedAccommodations } = req.body ?? {};
    const dup = await queryOne(
      "SELECT 1 FROM applications WHERE candidate_id = $1 AND job_id = $2",
      [candidateId, jobId],
    );
    if (dup) {
      return fail(res, 409, "ALREADY_APPLIED", "Você já se candidatou a esta vaga.");
    }
    const row = await queryOne(
      `WITH inserted AS (
         INSERT INTO applications (job_id, candidate_id, shared_accommodations)
         VALUES ($1, $2, $3::text[]) RETURNING *
       )
       SELECT i.*, j.title AS job_title, c.name AS company_name
       FROM inserted i
       JOIN jobs j ON j.id = i.job_id
       JOIN companies c ON c.user_id = j.company_id`,
      [
        jobId, candidateId,
        // NF2: grava apenas se houve consentimento explícito
        sharedAccommodations && sharedAccommodations.length > 0
          ? sharedAccommodations
          : null,
      ],
    );
    ok(res, toApplication(row as never));
  });

  app.patch("/applications/:id/status", async (req: Request, res: Response) => {
    const { status } = req.body ?? {};
    // Transação: muda o status E registra a notificação atomicamente (E3.2).
    // Se a notificação falhar, o status não fica "mudado pela metade".
    const app0 = await withTransaction(async (tx) => {
      const row = await tx.queryOne(
        `WITH updated AS (
           UPDATE applications SET status = $2::application_status
           WHERE id = $1 RETURNING *
         )
         SELECT u.*, j.title AS job_title, c.name AS company_name
         FROM updated u
         JOIN jobs j ON j.id = u.job_id
         JOIN companies c ON c.user_id = j.company_id`,
        [req.params.id, status],
      );
      if (!row) return null;
      const mapped = toApplication(row as never);
      await tx.query(
        `INSERT INTO notifications (user_id, type, payload)
         VALUES ($1, 'APPLICATION_STATUS', $2::jsonb)`,
        [mapped.candidateId, JSON.stringify({ jobTitle: mapped.jobTitle, status })],
      );
      return mapped;
    });
    if (!app0) return fail(res, 404, "NOT_FOUND", "Candidatura não encontrada.");
    ok(res, app0);
  });

  app.delete("/applications/:id", async (req, res) => {
    await query("DELETE FROM applications WHERE id = $1", [req.params.id]);
    res.status(204).end();
  });

  // ------------------------------- Empresas -------------------------------

  app.get("/companies/:userId", async (req, res) => {
    const row = await queryOne("SELECT * FROM companies WHERE user_id = $1", [
      req.params.userId,
    ]);
    if (!row) return fail(res, 404, "NOT_FOUND", "Empresa não encontrada.");
    ok(res, toCompany(row as never));
  });

  app.put("/companies/:userId", async (req: Request, res: Response) => {
    const c = req.body ?? {};
    const row = await queryOne(
      `INSERT INTO companies (user_id, name, cnpj, sector, description, inclusion_policy, accessibility_features, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name, cnpj = EXCLUDED.cnpj, sector = EXCLUDED.sector,
         description = EXCLUDED.description, inclusion_policy = EXCLUDED.inclusion_policy,
         accessibility_features = EXCLUDED.accessibility_features,
         website = EXCLUDED.website, updated_at = now()
       RETURNING *`,
      [
        req.params.userId, c.name ?? "", c.cnpj ?? "", c.sector ?? "",
        c.description ?? "", c.inclusionPolicy ?? "",
        c.accessibilityFeatures ?? [], c.website ?? null,
      ],
    );
    ok(res, toCompany(row as never));
  });

  // -------------------------- Perfil do candidato --------------------------

  app.get("/candidates/:userId/profile", async (req, res) => {
    const row = await queryOne<ProfileRow>(
      "SELECT * FROM candidate_profiles WHERE user_id = $1",
      [req.params.userId],
    );
    if (!row) return fail(res, 404, "NOT_FOUND", "Perfil não encontrado.");
    ok(res, toProfile(row));
  });

  app.put("/candidates/:userId/profile", async (req: Request, res: Response) => {
    const p = req.body ?? {};
    const r = p.resume ?? {};
    const row = await queryOne<ProfileRow>(
      `INSERT INTO candidate_profiles
         (user_id, headline, bio, skills, experience, education, salary_expectation,
          visibility, resume_name, resume_type, resume_size, resume_uploaded_at, sensitive_enc)
       VALUES ($1,$2,$3,$4::text[],$5,$6,$7,$8::profile_visibility,$9,$10,$11,$12,$13)
       ON CONFLICT (user_id) DO UPDATE SET
         headline = EXCLUDED.headline, bio = EXCLUDED.bio, skills = EXCLUDED.skills,
         experience = EXCLUDED.experience, education = EXCLUDED.education,
         salary_expectation = EXCLUDED.salary_expectation, visibility = EXCLUDED.visibility,
         resume_name = EXCLUDED.resume_name, resume_type = EXCLUDED.resume_type,
         resume_size = EXCLUDED.resume_size, resume_uploaded_at = EXCLUDED.resume_uploaded_at,
         sensitive_enc = EXCLUDED.sensitive_enc, updated_at = now()
       RETURNING *`,
      [
        req.params.userId, p.headline ?? "", p.bio ?? "", p.skills ?? [],
        p.experience ?? "", p.education ?? "", p.salaryExpectation ?? null,
        p.visibility ?? "APPLIED_ONLY", r.name ?? null, r.type ?? null,
        r.size ?? null, r.uploadedAt ?? null, p.sensitiveEnc ?? "",
      ],
    );
    ok(res, toProfile(row as ProfileRow));
  });

  // ------------------------------- Denúncias ------------------------------

  app.post("/reports", async (req: Request, res: Response) => {
    const r = req.body ?? {};
    const row = await queryOne(
      `INSERT INTO reports (target_type, target_id, target_label, reporter_id, reason, details)
       VALUES ($1::report_target,$2,$3,$4,$5,$6) RETURNING *`,
      [r.targetType, r.targetId, r.targetLabel, r.reporterId ?? null, r.reason, r.details ?? null],
    );
    ok(res, toReport(row as never));
  });

  app.get("/reports", async (req, res) => {
    const status = String(req.query.status ?? "PENDING");
    const rows = await query(
      "SELECT * FROM reports WHERE status = $1::report_status ORDER BY created_at DESC",
      [status],
    );
    ok(res, rows.map((r) => toReport(r as never)));
  });

  app.patch("/reports/:id/status", async (req: Request, res: Response) => {
    const row = await queryOne(
      "UPDATE reports SET status = $2::report_status WHERE id = $1 RETURNING *",
      [req.params.id, req.body?.status],
    );
    if (!row) return fail(res, 404, "NOT_FOUND", "Denúncia não encontrada.");
    ok(res, toReport(row as never));
  });

  // ------------------------- Moderação / Admin ----------------------------

  app.get("/admin/moderation/queue", requireRole("ADMIN"), async (_req, res) => {
    const [jobs, companies, reports] = await Promise.all([
      query<JobRow>(`${JOB_SELECT} WHERE j.status = 'PENDING' ORDER BY j.created_at`),
      query("SELECT * FROM companies WHERE verification_status = 'PENDING'"),
      query("SELECT * FROM reports WHERE status = 'PENDING' ORDER BY created_at DESC"),
    ]);
    ok(res, {
      jobs: jobs.map(toJob),
      companies: companies.map((c) => toCompany(c as never)),
      reports: reports.map((r) => toReport(r as never)),
    });
  });

  app.patch("/admin/jobs/:id/review", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const { action, reason, adminId, adminName } = req.body ?? {};
    const approve = action === "approve";
    // Transação (M1): mudar status + auditar (NF8) + notificar são atômicos.
    const row = await withTransaction(async (tx) => {
      const updated = await tx.queryOne<JobRow>(
        `WITH updated AS (
           UPDATE jobs SET
             status = $2::job_status,
             published_at = CASE WHEN $3 THEN now() ELSE NULL END
           WHERE id = $1 RETURNING *
         )
         SELECT u.*, c.name AS company_name FROM updated u
         JOIN companies c ON c.user_id = u.company_id`,
        [req.params.id, approve ? "APPROVED" : "REJECTED", approve],
      );
      if (!updated) return null;
      await audit(adminId, adminName, "JOB", updated.id, updated.title,
        approve ? "APPROVE" : action === "request_changes" ? "REQUEST_CHANGES" : "REJECT", reason, tx);
      await notify(updated.company_id, "MODERATION", {
        message: approve
          ? `Sua vaga "${updated.title}" foi aprovada e publicada.`
          : `Sua vaga "${updated.title}" foi rejeitada. Motivo: ${reason ?? "-"}`,
      }, tx);
      return updated;
    });
    if (!row) return fail(res, 404, "NOT_FOUND", "Vaga não encontrada.");
    ok(res, toJob(row));
  });

  app.patch("/admin/companies/:userId/verify", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const { status, reason, adminId, adminName } = req.body ?? {};
    const company = await withTransaction(async (tx) => {
      const row = await tx.queryOne(
        `UPDATE companies SET verification_status = $2::verification_status, updated_at = now()
         WHERE user_id = $1 RETURNING *`,
        [req.params.userId, status],
      );
      if (!row) return null;
      const mapped = toCompany(row as never);
      await audit(adminId, adminName, "COMPANY", mapped.userId, mapped.name,
        status === "VERIFIED" ? "VERIFY" : "REJECT_VERIFICATION", reason, tx);
      return mapped;
    });
    if (!company) return fail(res, 404, "NOT_FOUND", "Empresa não encontrada.");
    ok(res, company);
  });

  app.get("/admin/users", requireRole("ADMIN"), async (_req, res) => {
    const rows = await query(
      "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at",
    );
    ok(res, rows.map((r) => toUser(r as never)));
  });

  app.patch("/admin/users/:id/status", requireRole("ADMIN"), async (req: Request, res: Response) => {
    const { status, reason, adminId, adminName } = req.body ?? {};
    const user = await withTransaction(async (tx) => {
      const row = await tx.queryOne(
        `UPDATE users SET status = $2::user_status WHERE id = $1
         RETURNING id, name, email, role, status, created_at`,
        [req.params.id, status],
      );
      if (!row) return null;
      const mapped = toUser(row as never);
      await audit(adminId, adminName, "USER", mapped.id, mapped.name,
        status === "SUSPENDED" ? "SUSPEND_USER" : "REACTIVATE_USER", reason, tx);
      return mapped;
    });
    if (!user) return fail(res, 404, "NOT_FOUND", "Conta não encontrada.");
    ok(res, user);
  });

  app.get("/admin/audit", requireRole("ADMIN"), async (_req, res) => {
    const rows = await query(
      "SELECT * FROM moderation_actions ORDER BY created_at DESC LIMIT 200",
    );
    ok(res, rows.map((r) => toModerationAction(r as never)));
  });

  app.get("/admin/metrics", requireRole("ADMIN"), async (_req, res) => {
    const [users, jobs, companies, reports] = await Promise.all([
      query<{ role: string; status: string; count: string }>(
        "SELECT role::text, status::text, count(*) FROM users GROUP BY role, status",
      ),
      query<{ status: string; count: string }>(
        "SELECT status::text, count(*) FROM jobs GROUP BY status",
      ),
      query<{ verification_status: string; count: string }>(
        "SELECT verification_status::text, count(*) FROM companies GROUP BY verification_status",
      ),
      query<{ count: string }>(
        "SELECT count(*) FROM reports WHERE status = 'PENDING'",
      ),
    ]);
    ok(res, { users, jobs, companies, reportsPending: Number(reports[0]?.count ?? 0) });
  });

  // ------------------------------ LGPD / NF2 ------------------------------

  app.get("/privacy/:userId/export", async (req, res) => {
    const userId = req.params.userId;
    const [user, profile, applications, favorites, alerts, reports, consent] =
      await Promise.all([
        queryOne("SELECT id, name, email, role, status, created_at FROM users WHERE id = $1", [userId]),
        queryOne<ProfileRow>("SELECT * FROM candidate_profiles WHERE user_id = $1", [userId]),
        query(`SELECT a.*, j.title AS job_title, c.name AS company_name
               FROM applications a JOIN jobs j ON j.id = a.job_id
               JOIN companies c ON c.user_id = j.company_id
               WHERE a.candidate_id = $1`, [userId]),
        query("SELECT * FROM favorites WHERE candidate_id = $1", [userId]),
        query("SELECT * FROM job_alerts WHERE candidate_id = $1", [userId]),
        query("SELECT * FROM reports WHERE reporter_id = $1", [userId]),
        queryOne("SELECT * FROM consents WHERE user_id = $1", [userId]),
      ]);
    if (!user) return fail(res, 404, "NOT_FOUND", "Conta não encontrada.");
    ok(res, {
      exportedAt: new Date().toISOString(),
      account: toUser(user as never),
      profile: profile ? toProfile(profile) : null,
      applications: applications.map((a) => toApplication(a as never)),
      favorites, alerts,
      reports: reports.map((r) => toReport(r as never)),
      consent,
    });
  });

  app.delete("/privacy/:userId", async (req, res) => {
    // ON DELETE CASCADE remove perfil, candidaturas, favoritos, alertas,
    // notificações e consentimento (direito à exclusão — NF2).
    await query("DELETE FROM users WHERE id = $1", [req.params.userId]);
    res.status(204).end();
  });

  app.put("/privacy/:userId/consent", async (req: Request, res: Response) => {
    const row = await queryOne(
      `INSERT INTO consents (user_id, version) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET version = EXCLUDED.version, accepted_at = now()
       RETURNING *`,
      [req.params.userId, req.body?.version ?? "1"],
    );
    ok(res, row);
  });

  app.delete("/privacy/:userId/consent", async (req, res) => {
    await query("DELETE FROM consents WHERE user_id = $1", [req.params.userId]);
    res.status(204).end();
  });

  // Tratamento de erro central: nunca vaza stack para o cliente.
  app.use(
    (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
      console.error("[api]", err.message);
      res.status(500).json({
        error: { code: "INTERNAL", message: "Erro interno no servidor." },
      });
    },
  );

  return app;
}

// ------------------------------- Auxiliares --------------------------------

type ProfileRow = Record<string, unknown>;

function toProfile(row: ProfileRow) {
  const r = row;
  return {
    userId: r.user_id,
    headline: r.headline,
    bio: r.bio,
    skills: r.skills ?? [],
    experience: r.experience,
    education: r.education,
    salaryExpectation: r.salary_expectation ?? "",
    visibility: r.visibility,
    resume: r.resume_name
      ? {
          name: r.resume_name,
          type: r.resume_type,
          size: r.resume_size,
          uploadedAt: toIso(r.resume_uploaded_at),
          dataUrl: "",
        }
      : undefined,
    // O bloco sensível volta CIFRADO; só o cliente do titular decifra (NF2).
    sensitiveEnc: r.sensitive_enc ?? "",
    updatedAt: toIso(r.updated_at),
  };
}

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

/** Registra uma ação de moderação na auditoria (NF8). Aceita um Tx opcional. */
async function audit(
  adminId: string | undefined, adminName: string | undefined,
  targetType: string, targetId: string, targetLabel: string,
  action: string, reason?: string, tx?: Tx,
) {
  const run = tx ?? { query };
  await run.query(
    `INSERT INTO moderation_actions (admin_id, admin_name, target_type, target_id, target_label, action, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [adminId ?? null, adminName ?? "Administração", targetType, targetId, targetLabel, action, reason ?? null],
  );
}

/** Cria uma notificação para o usuário. Aceita um Tx opcional. */
async function notify(userId: string, type: string, payload: unknown, tx?: Tx) {
  const run = tx ?? { query };
  await run.query(
    "INSERT INTO notifications (user_id, type, payload) VALUES ($1,$2,$3::jsonb)",
    [userId, type, JSON.stringify(payload)],
  );
}

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return [value];
  return [];
}

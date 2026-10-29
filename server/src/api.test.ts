import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";
import { pool, resetAndSeed } from "./db.js";

/**
 * Testes de integração da API contra um PostgreSQL REAL.
 * Pré-requisito: banco disponível em DATABASE_URL (ver scripts/postgres.sh).
 * O schema é recriado e o seed reinjetado antes da suíte.
 */

const app = createApp();

// IDs fixos do seed
const COMPANY_TECH = "00000000-0000-0000-0000-0000000000c1";
const COMPANY_EDU = "00000000-0000-0000-0000-0000000000c4";
const CAND_ANA = "00000000-0000-0000-0000-0000000000d1";
const CAND_BRUNO = "00000000-0000-0000-0000-0000000000d2";
const JOB_FRONT = "00000000-0000-0000-0000-0000000000f1";
const JOB_PENDING = "00000000-0000-0000-0000-0000000000f7";
const ADMIN = "00000000-0000-0000-0000-0000000000a1";

// Token JWT do administrador (as rotas /admin exigem o papel ADMIN — RBAC).
let adminToken = "";
const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });

beforeAll(async () => {
  await resetAndSeed();
  const login = await request(app)
    .post("/auth/login")
    .send({ email: "admin@conectainclusao.org", password: "Admin@123" })
    .expect(200);
  adminToken = login.body.token;
}, 60_000);

afterAll(async () => {
  await pool.end();
});

describe("Saúde e seed", () => {
  it("responde /health", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
  });

  it("semeia 5 empresas e 5 candidatos", async () => {
    const res = await request(app).get("/admin/users").set(asAdmin()).expect(200);
    const companies = res.body.filter((u: { role: string }) => u.role === "COMPANY");
    const candidates = res.body.filter((u: { role: string }) => u.role === "CANDIDATE");
    const admins = res.body.filter((u: { role: string }) => u.role === "ADMIN");
    expect(companies).toHaveLength(5);
    expect(candidates).toHaveLength(5);
    expect(admins).toHaveLength(1);
  });

  it("semeia candidaturas em TODOS os estados", async () => {
    const { rows } = await pool.query(
      "SELECT status::text, count(*)::int AS n FROM applications GROUP BY status",
    );
    const byStatus = Object.fromEntries(
      rows.map((r: { status: string; n: number }) => [r.status, r.n]),
    );
    expect(byStatus.SENT).toBeGreaterThan(0);
    expect(byStatus.REVIEW).toBeGreaterThan(0);
    expect(byStatus.INTERVIEW).toBeGreaterThan(0);
    expect(byStatus.FINISHED).toBeGreaterThan(0);
  });
});

describe("Busca pública de vagas (P2)", () => {
  it("retorna apenas vagas APPROVED", async () => {
    const res = await request(app).get("/jobs").expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every((j: { status: string }) => j.status === "APPROVED"),
    ).toBe(true);
    // A vaga PENDING do seed não pode aparecer
    expect(res.body.find((j: { id: string }) => j.id === JOB_PENDING)).toBeUndefined();
  });

  it("filtra por palavra-chave, modalidade e recurso de acessibilidade", async () => {
    const byKeyword = await request(app).get("/jobs?q=front-end").expect(200);
    expect(byKeyword.body.some((j: { id: string }) => j.id === JOB_FRONT)).toBe(true);

    const remote = await request(app).get("/jobs?modalidade=REMOTE").expect(200);
    expect(
      remote.body.every((j: { modality: string }) => j.modality === "REMOTE"),
    ).toBe(true);

    const libras = await request(app).get("/jobs?feature=SIGN_LANGUAGE").expect(200);
    expect(libras.body.length).toBeGreaterThan(0);
    expect(
      libras.body.every((j: { accessibilityFeatures: string[] }) =>
        j.accessibilityFeatures.includes("SIGN_LANGUAGE"),
      ),
    ).toBe(true);
  });

  it("não expõe vaga em moderação por URL direta", async () => {
    await request(app).get(`/jobs/${JOB_PENDING}`).expect(404);
    await request(app).get(`/jobs/${JOB_FRONT}`).expect(200);
  });
});

describe("Autenticação", () => {
  it("faz login com uma conta do seed", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "ana.souza@exemplo.com", password: "Senha@123" })
      .expect(200);
    expect(res.body.user.role).toBe("CANDIDATE");
  });

  it("bloqueia login de conta suspensa (M2.5)", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "elisa.prado@exemplo.com", password: "Senha@123" })
      .expect(403);
    expect(res.body.error.code).toBe("ACCOUNT_SUSPENDED");
  });

  it("rejeita credenciais inválidas", async () => {
    await request(app)
      .post("/auth/login")
      .send({ email: "ana.souza@exemplo.com", password: "errada" })
      .expect(401);
  });

  it("registra uma conta nova e recusa e-mail duplicado", async () => {
    const email = `novo-${Date.now()}@exemplo.com`;
    await request(app)
      .post("/auth/register")
      .send({ name: "Novo Candidato", email, password: "Senha@123", accountType: "candidate" })
      .expect(200);
    await request(app)
      .post("/auth/register")
      .send({ name: "Outro", email, password: "Senha@123", accountType: "candidate" })
      .expect(409);
  });

  it("emite JWT bcrypt-verificável e aplica RBAC nas rotas /admin", async () => {
    // Sem token: 401.
    await request(app).get("/admin/users").expect(401);

    // Com token de candidato (papel errado): 403.
    const cand = await request(app)
      .post("/auth/login")
      .send({ email: "ana.souza@exemplo.com", password: "Senha@123" })
      .expect(200);
    await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${cand.body.token}`)
      .expect(403);

    // Com token de admin: 200.
    await request(app).get("/admin/users").set(asAdmin()).expect(200);
  });
});

describe("Candidaturas (C2 / NF2)", () => {
  it("lista candidaturas do candidato com status", async () => {
    const res = await request(app)
      .get(`/candidates/${CAND_ANA}/applications`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("status");
  });

  it("só expõe acomodações quando houve consentimento", async () => {
    const res = await request(app)
      .get(`/jobs/${JOB_FRONT}/applications`)
      .expect(200);
    const withConsent = res.body.find(
      (a: { candidateId: string }) => a.candidateId === CAND_ANA,
    );
    expect(withConsent.sharedAccommodations).toContain("SCREEN_READER");
    // Diego aplicou na mesma vaga sem compartilhar
    const without = res.body.find(
      (a: { candidateId: string }) =>
        a.candidateId === "00000000-0000-0000-0000-0000000000d4",
    );
    expect(without.sharedAccommodations).toBeUndefined();
  });

  it("impede candidatura duplicada", async () => {
    await request(app)
      .post("/applications")
      .send({ candidateId: CAND_ANA, jobId: JOB_FRONT })
      .expect(409);
  });

  it("atualiza status e gera notificação ao candidato (E3.2)", async () => {
    const list = await request(app)
      .get(`/candidates/${CAND_BRUNO}/applications`)
      .expect(200);
    const target = list.body[0];

    await request(app)
      .patch(`/applications/${target.id}/status`)
      .send({ status: "INTERVIEW" })
      .expect(200);

    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM notifications
       WHERE user_id = $1 AND type = 'APPLICATION_STATUS'`,
      [CAND_BRUNO],
    );
    expect(rows[0].n).toBeGreaterThan(0);
  });
});

describe("Moderação (M1 / NF8)", () => {
  it("expõe a fila com vagas, empresas e denúncias pendentes", async () => {
    const res = await request(app).get("/admin/moderation/queue").set(asAdmin()).expect(200);
    expect(res.body.jobs.length).toBeGreaterThan(0);
    expect(res.body.companies.length).toBeGreaterThan(0);
    expect(res.body.reports.length).toBeGreaterThan(0);
  });

  it("aprovar vaga publica e registra auditoria", async () => {
    await request(app)
      .patch(`/admin/jobs/${JOB_PENDING}/review`)
      .set(asAdmin())
      .send({ action: "approve", adminId: ADMIN, adminName: "Admin Teste" })
      .expect(200);

    // Agora aparece no público
    await request(app).get(`/jobs/${JOB_PENDING}`).expect(200);

    const audit = await request(app).get("/admin/audit").set(asAdmin()).expect(200);
    expect(
      audit.body.some(
        (a: { targetId: string; action: string }) =>
          a.targetId === JOB_PENDING && a.action === "APPROVE",
      ),
    ).toBe(true);
  });

  it("verificar empresa muda o status e audita", async () => {
    await request(app)
      .patch(`/admin/companies/${COMPANY_EDU}/verify`)
      .set(asAdmin())
      .send({ status: "VERIFIED", adminId: ADMIN, adminName: "Admin Teste" })
      .expect(200);
    const company = await request(app).get(`/companies/${COMPANY_EDU}`).expect(200);
    expect(company.body.verificationStatus).toBe("VERIFIED");
  });

  it("suspende e reativa conta", async () => {
    await request(app)
      .patch(`/admin/users/${CAND_BRUNO}/status`)
      .set(asAdmin())
      .send({ status: "SUSPENDED", reason: "teste", adminId: ADMIN, adminName: "Admin" })
      .expect(200);
    await request(app)
      .post("/auth/login")
      .send({ email: "bruno.carvalho@exemplo.com", password: "Senha@123" })
      .expect(403);

    await request(app)
      .patch(`/admin/users/${CAND_BRUNO}/status`)
      .set(asAdmin())
      .send({ status: "ACTIVE", adminId: ADMIN, adminName: "Admin" })
      .expect(200);
    await request(app)
      .post("/auth/login")
      .send({ email: "bruno.carvalho@exemplo.com", password: "Senha@123" })
      .expect(200);
  });
});

describe("CRUD de vagas da empresa (E2)", () => {
  it("cria vaga em PENDING e edição de aprovada volta à moderação", async () => {
    const created = await request(app)
      .post("/jobs")
      .send({
        companyId: COMPANY_TECH, title: "Pessoa QA de Acessibilidade",
        description: "Testes manuais e automatizados de acessibilidade.",
        location: "Remoto", modality: "REMOTE", level: "MID", area: "Tecnologia",
        accessibilityFeatures: ["SCREEN_READER"],
      })
      .expect(200);
    expect(created.body.status).toBe("PENDING");

    // aprova e então edita
    await request(app)
      .patch(`/admin/jobs/${created.body.id}/review`)
      .set(asAdmin())
      .send({ action: "approve", adminId: ADMIN, adminName: "Admin" })
      .expect(200);

    const edited = await request(app)
      .patch(`/jobs/${created.body.id}`)
      .send({ companyId: COMPANY_TECH, title: "Pessoa QA Sênior" })
      .expect(200);
    expect(edited.body.status).toBe("PENDING");
    expect(edited.body.publishedAt).toBeUndefined();
  });
});

describe("Feed de publicações (posts)", () => {
  it("lista o feed semeado com curtidas e comentários agregados", async () => {
    const res = await request(app).get("/posts").expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    const first = res.body[0];
    expect(first).toHaveProperty("likedBy");
    expect(Array.isArray(first.likedBy)).toBe(true);
    expect(first).toHaveProperty("comments");
    expect(Array.isArray(first.comments)).toBe(true);
    // Resolve o papel e o título do autor
    expect(first).toHaveProperty("authorName");
    expect(first).toHaveProperty("authorRole");
  });

  it("cria uma publicação e a traz no topo do feed", async () => {
    const created = await request(app)
      .post("/posts")
      .send({ authorId: CAND_ANA, content: "Minha primeira publicação de teste." })
      .expect(200);
    expect(created.body.content).toBe("Minha primeira publicação de teste.");
    expect(created.body.likedBy).toEqual([]);
    expect(created.body.comments).toEqual([]);

    const feed = await request(app).get("/posts").expect(200);
    expect(feed.body[0].id).toBe(created.body.id);
  });

  it("recusa publicação sem conteúdo", async () => {
    await request(app)
      .post("/posts")
      .send({ authorId: CAND_ANA, content: "   " })
      .expect(400);
  });

  it("curtir é idempotente por usuário e alterna ao repetir", async () => {
    const created = await request(app)
      .post("/posts")
      .send({ authorId: CAND_ANA, content: "Post para curtir." })
      .expect(200);

    const liked = await request(app)
      .post(`/posts/${created.body.id}/like`)
      .send({ userId: CAND_BRUNO })
      .expect(200);
    expect(liked.body.likedBy).toContain(CAND_BRUNO);

    // repetir remove a curtida (toggle)
    const unliked = await request(app)
      .post(`/posts/${created.body.id}/like`)
      .send({ userId: CAND_BRUNO })
      .expect(200);
    expect(unliked.body.likedBy).not.toContain(CAND_BRUNO);
  });

  it("adiciona comentário resolvendo o nome do autor", async () => {
    const created = await request(app)
      .post("/posts")
      .send({ authorId: CAND_ANA, content: "Post para comentar." })
      .expect(200);

    const commented = await request(app)
      .post(`/posts/${created.body.id}/comments`)
      .send({ authorId: CAND_BRUNO, content: "Comentário de teste." })
      .expect(200);
    expect(commented.body.comments).toHaveLength(1);
    expect(commented.body.comments[0].content).toBe("Comentário de teste.");
    expect(commented.body.comments[0].authorName).toBeTruthy();
  });

  it("o autor pode excluir sua publicação", async () => {
    const created = await request(app)
      .post("/posts")
      .send({ authorId: CAND_ANA, content: "Post a excluir." })
      .expect(200);

    await request(app)
      .delete(`/posts/${created.body.id}?userId=${CAND_ANA}`)
      .expect(204);

    const feed = await request(app).get("/posts").expect(200);
    expect(feed.body.find((p: { id: string }) => p.id === created.body.id)).toBeUndefined();
  });
});

describe("Campanhas das empresas (vitrine + moderação)", () => {
  it("a vitrine pública mostra apenas campanhas APPROVED", async () => {
    const res = await request(app).get("/campaigns").expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every((c: { status: string }) => c.status === "APPROVED"),
    ).toBe(true);
    // resolve o nome da empresa autora
    expect(res.body[0].companyName).toBeTruthy();
  });

  it("empresa cria campanha em PENDING e ela não aparece na vitrine", async () => {
    const created = await request(app)
      .post("/campaigns")
      .send({
        companyId: COMPANY_TECH,
        title: "Semana da Acessibilidade",
        subtitle: "TechInclui · Evento",
        description: "Palestras e oficinas abertas sobre tecnologia assistiva.",
        callToAction: "Inscrever-se",
        tag: "Evento",
      })
      .expect(200);
    expect(created.body.status).toBe("PENDING");

    const vitrine = await request(app).get("/campaigns").expect(200);
    expect(
      vitrine.body.find((c: { id: string }) => c.id === created.body.id),
    ).toBeUndefined();

    // aparece na lista da própria empresa
    const mine = await request(app)
      .get(`/companies/${COMPANY_TECH}/campaigns`)
      .expect(200);
    expect(mine.body.some((c: { id: string }) => c.id === created.body.id)).toBe(
      true,
    );
  });

  it("admin aprova a campanha e ela passa a aparecer na vitrine (RBAC)", async () => {
    const created = await request(app)
      .post("/campaigns")
      .send({
        companyId: COMPANY_TECH,
        title: "Trilha de Mentoria Inclusiva",
        description: "Mentoria para pessoas com deficiência em início de carreira.",
        tag: "Educação",
      })
      .expect(200);

    // sem token de admin: negado
    await request(app)
      .patch(`/admin/campaigns/${created.body.id}/review`)
      .send({ action: "approve" })
      .expect(401);

    const approved = await request(app)
      .patch(`/admin/campaigns/${created.body.id}/review`)
      .set(asAdmin())
      .send({ action: "approve", adminId: ADMIN, adminName: "Admin Teste" })
      .expect(200);
    expect(approved.body.status).toBe("APPROVED");
    expect(approved.body.publishedAt).toBeTruthy();

    const vitrine = await request(app).get("/campaigns").expect(200);
    expect(
      vitrine.body.some((c: { id: string }) => c.id === created.body.id),
    ).toBe(true);
  });

  it("admin recusa a campanha registrando o motivo", async () => {
    const created = await request(app)
      .post("/campaigns")
      .send({
        companyId: COMPANY_TECH,
        title: "Campanha incompleta",
        description: "Texto que precisa de ajustes.",
        tag: "Compromisso",
      })
      .expect(200);

    const rejected = await request(app)
      .patch(`/admin/campaigns/${created.body.id}/review`)
      .set(asAdmin())
      .send({
        action: "reject",
        reason: "Detalhe os recursos de acessibilidade.",
        adminId: ADMIN,
        adminName: "Admin",
      })
      .expect(200);
    expect(rejected.body.status).toBe("REJECTED");
    expect(rejected.body.reviewReason).toMatch(/acessibilidade/i);
  });

  it("inclui campanhas pendentes na fila de moderação", async () => {
    const res = await request(app)
      .get("/admin/moderation/queue")
      .set(asAdmin())
      .expect(200);
    expect(Array.isArray(res.body.campaigns)).toBe(true);
  });

  it("recusa criar campanha sem título ou descrição", async () => {
    await request(app)
      .post("/campaigns")
      .send({ companyId: COMPANY_TECH, title: "" })
      .expect(400);
  });
});

describe("LGPD (NF2)", () => {
  it("exporta os dados do titular", async () => {
    const res = await request(app).get(`/privacy/${CAND_ANA}/export`).expect(200);
    expect(res.body.account.id).toBe(CAND_ANA);
    expect(res.body.applications.length).toBeGreaterThan(0);
    // o bloco sensível vem cifrado
    expect(String(res.body.profile.sensitiveEnc)).toMatch(/^enc:/);
  });

  it("exclui a conta e os dados associados em cascata", async () => {
    const victim = "00000000-0000-0000-0000-0000000000d5";
    await request(app).delete(`/privacy/${victim}`).expect(204);

    const { rows } = await pool.query(
      `SELECT
         (SELECT count(*)::int FROM users WHERE id = $1) AS u,
         (SELECT count(*)::int FROM candidate_profiles WHERE user_id = $1) AS p`,
      [victim],
    );
    expect(rows[0].u).toBe(0);
    expect(rows[0].p).toBe(0);
  });
});

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { db, migrate } from "./db.js";

/**
 * Semente inicial: garante um administrador para a moderação e um catálogo de
 * vagas aprovadas para a busca pública ter conteúdo. Idempotente — só insere o
 * que faltar, nunca duplica.
 */

function hasUser(email) {
  return !!db.prepare("SELECT id FROM users WHERE email = ?").get(email);
}

export function seed() {
  // Administrador padrão (Fase 6).
  if (!db.prepare("SELECT id FROM users WHERE role = 'ADMIN'").get()) {
    db.prepare(
      `INSERT INTO users (id, name, email, role, status, password_hash, created_at)
       VALUES (?, ?, ?, 'ADMIN', 'ACTIVE', ?, ?)`,
    ).run(
      randomUUID(),
      "Administração Conecta",
      "admin@conectainclusao.org",
      bcrypt.hashSync("Admin@123", 10),
      new Date().toISOString(),
    );
  }

  // Empresa-semente para dona das vagas de exemplo (login opcional).
  let seedCompanyId;
  const existingCompany = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("contato@techinclui.example");
  if (existingCompany) {
    seedCompanyId = existingCompany.id;
  } else {
    seedCompanyId = randomUUID();
    db.prepare(
      `INSERT INTO users (id, name, email, role, status, password_hash, created_at)
       VALUES (?, ?, ?, 'COMPANY', 'ACTIVE', ?, ?)`,
    ).run(
      seedCompanyId,
      "TechInclui",
      "contato@techinclui.example",
      bcrypt.hashSync("Empresa@123", 10),
      new Date().toISOString(),
    );
    db.prepare(
      `INSERT INTO companies (user_id, name, cnpj, sector, description, inclusion_policy,
          accessibility_features, website, verification_status, updated_at)
       VALUES (?, 'TechInclui', '12345678000190', 'Tecnologia',
          'Produtos digitais acessíveis.', 'Contratamos e desenvolvemos talentos PcD.',
          ?, 'https://techinclui.example', 'VERIFIED', ?)`,
    ).run(
      seedCompanyId,
      JSON.stringify(["SCREEN_READER", "FLEXIBLE_HOURS", "ASSISTIVE_TECH"]),
      new Date().toISOString(),
    );
  }

  // Catálogo de vagas (só insere se ainda não houver vagas).
  if (db.prepare("SELECT COUNT(*) n FROM jobs").get().n === 0) {
    const jobs = [
      {
        companyName: "TechInclui",
        title: "Pessoa Desenvolvedora Front-end",
        description:
          "Atuação em produtos web acessíveis (WCAG 2.1 AA) com React e TypeScript. " +
          "Você trabalhará com uma equipe que prioriza acessibilidade desde o design.",
        location: "São Paulo, SP",
        modality: "REMOTE",
        level: "MID",
        area: "Tecnologia",
        accessibilityFeatures: ["SCREEN_READER", "FLEXIBLE_HOURS", "ASSISTIVE_TECH", "INCLUSIVE_ONBOARDING"],
        status: "APPROVED",
        createdAt: "2026-09-20T12:00:00.000Z",
        publishedAt: "2026-09-21T12:00:00.000Z",
      },
      {
        companyName: "CuidarBem Saúde",
        title: "Analista de Atendimento (Libras)",
        description:
          "Atendimento humanizado a clientes, com suporte em Libras. Oferecemos intérprete e materiais acessíveis.",
        location: "Belo Horizonte, MG",
        modality: "HYBRID",
        level: "JUNIOR",
        area: "Atendimento",
        accessibilityFeatures: ["SIGN_LANGUAGE", "INCLUSIVE_ONBOARDING", "FLEXIBLE_HOURS"],
        status: "APPROVED",
        createdAt: "2026-09-25T12:00:00.000Z",
        publishedAt: "2026-09-26T12:00:00.000Z",
      },
      {
        companyName: "LogAccess",
        title: "Pessoa Analista Financeira Sênior",
        description:
          "Planejamento e análise financeira em ambiente totalmente acessível, com estações de trabalho adaptadas.",
        location: "Rio de Janeiro, RJ",
        modality: "ONSITE",
        level: "SENIOR",
        area: "Financeiro",
        accessibilityFeatures: ["WHEELCHAIR_ACCESS", "ASSISTIVE_TECH", "INCLUSIVE_ONBOARDING"],
        status: "APPROVED",
        createdAt: "2026-10-01T12:00:00.000Z",
        publishedAt: "2026-10-02T12:00:00.000Z",
      },
      {
        companyName: "TechInclui",
        title: "Pessoa Designer de Produto (UX) Acessível",
        description:
          "Projetos de experiência com foco em inclusão: pesquisa com pessoas com deficiência e protótipos testáveis por leitor de tela.",
        location: "Remoto (Brasil)",
        modality: "REMOTE",
        level: "SENIOR",
        area: "Design",
        accessibilityFeatures: ["SCREEN_READER", "FLEXIBLE_HOURS", "ASSISTIVE_TECH"],
        status: "APPROVED",
        createdAt: "2026-10-05T12:00:00.000Z",
        publishedAt: "2026-10-06T12:00:00.000Z",
      },
      {
        companyName: "EduLivre",
        title: "Pessoa Educadora de Conteúdo",
        description:
          "Produção de material didático acessível. Esta vaga está em moderação e NÃO deve aparecer na busca pública.",
        location: "Curitiba, PR",
        modality: "HYBRID",
        level: "MID",
        area: "Educação",
        accessibilityFeatures: ["SCREEN_READER", "INCLUSIVE_ONBOARDING"],
        status: "PENDING",
        createdAt: "2026-10-10T12:00:00.000Z",
        publishedAt: null,
      },
    ];
    const insert = db.prepare(
      `INSERT INTO jobs (id, company_id, company_name, title, description, location,
          modality, level, area, accessibility_features, status, created_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const tx = db.transaction(() => {
      for (const j of jobs) {
        insert.run(
          randomUUID(),
          seedCompanyId,
          j.companyName,
          j.title,
          j.description,
          j.location,
          j.modality,
          j.level,
          j.area,
          JSON.stringify(j.accessibilityFeatures),
          j.status,
          j.createdAt,
          j.publishedAt,
        );
      }
    });
    tx();
  }
}

// Permite rodar `node src/seed.js` manualmente.
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
  seed();
  console.log("Seed concluído.");
  process.exit(0);
}

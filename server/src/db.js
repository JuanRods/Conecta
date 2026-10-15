import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

/**
 * Camada de banco de dados (SQLite via better-sqlite3).
 *
 * Escolhemos SQLite porque é um banco relacional real, com arquivo em disco,
 * transações ACID e SQL completo — sem exigir um servidor externo. O schema
 * espelha o modelo de dados do design (.kiro/specs/conecta-inclusao/design.md):
 * users, companies, candidate_profiles, jobs, applications, favorites,
 * job_alerts, notifications, reports, moderation_audit e privacy_consents.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.CONECTA_DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = process.env.CONECTA_DB_FILE || path.join(DATA_DIR, "conecta.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/** Zera todas as tabelas (uso em testes). O chamador deve re-semear depois. */
export function resetDatabase() {
  const tables = [
    "privacy_consents",
    "moderation_audit",
    "reports",
    "notifications",
    "job_alerts",
    "favorites",
    "applications",
    "jobs",
    "candidate_profiles",
    "companies",
    "users",
  ];
  const tx = db.transaction(() => {
    for (const t of tables) db.exec(`DELETE FROM ${t};`);
  });
  tx();
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE,
      role           TEXT NOT NULL CHECK (role IN ('CANDIDATE','COMPANY','ADMIN')),
      status         TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','SUSPENDED')),
      password_hash  TEXT NOT NULL,
      created_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS companies (
      user_id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name                  TEXT NOT NULL DEFAULT '',
      cnpj                  TEXT NOT NULL DEFAULT '',
      sector                TEXT NOT NULL DEFAULT '',
      description           TEXT NOT NULL DEFAULT '',
      inclusion_policy      TEXT NOT NULL DEFAULT '',
      accessibility_features TEXT NOT NULL DEFAULT '[]',
      website               TEXT NOT NULL DEFAULT '',
      verification_status   TEXT NOT NULL DEFAULT 'PENDING'
                              CHECK (verification_status IN ('PENDING','VERIFIED','REJECTED')),
      updated_at            TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      headline           TEXT NOT NULL DEFAULT '',
      bio                TEXT NOT NULL DEFAULT '',
      skills             TEXT NOT NULL DEFAULT '[]',
      experience         TEXT NOT NULL DEFAULT '',
      education          TEXT NOT NULL DEFAULT '',
      salary_expectation TEXT NOT NULL DEFAULT '',
      visibility         TEXT NOT NULL DEFAULT 'APPLIED_ONLY'
                           CHECK (visibility IN ('PUBLIC','APPLIED_ONLY','PRIVATE')),
      resume             TEXT,              -- JSON do ResumeFile (ou NULL)
      sensitive_enc      TEXT NOT NULL DEFAULT '', -- bloco sensível cifrado em repouso (NF2)
      updated_at         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id                     TEXT PRIMARY KEY,
      company_id             TEXT NOT NULL,
      company_name           TEXT NOT NULL,
      title                  TEXT NOT NULL,
      description            TEXT NOT NULL,
      location               TEXT NOT NULL,
      modality               TEXT NOT NULL CHECK (modality IN ('REMOTE','HYBRID','ONSITE')),
      level                  TEXT NOT NULL CHECK (level IN ('JUNIOR','MID','SENIOR')),
      area                   TEXT NOT NULL,
      accessibility_features TEXT NOT NULL DEFAULT '[]',
      status                 TEXT NOT NULL
                               CHECK (status IN ('DRAFT','PENDING','APPROVED','REJECTED','PAUSED','CLOSED')),
      created_at             TEXT NOT NULL,
      published_at           TEXT
    );

    CREATE TABLE IF NOT EXISTS applications (
      id                    TEXT PRIMARY KEY,
      job_id                TEXT NOT NULL,
      job_title             TEXT NOT NULL,
      company_name          TEXT NOT NULL,
      candidate_id          TEXT NOT NULL,
      status                TEXT NOT NULL DEFAULT 'SENT'
                              CHECK (status IN ('SENT','REVIEW','INTERVIEW','FINISHED')),
      shared_accommodations TEXT,          -- JSON array (ou NULL = não compartilhado)
      created_at            TEXT NOT NULL,
      UNIQUE (candidate_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      candidate_id TEXT NOT NULL,
      job_id       TEXT NOT NULL,
      job_title    TEXT NOT NULL,
      company_name TEXT NOT NULL,
      saved_at     TEXT NOT NULL,
      PRIMARY KEY (candidate_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS job_alerts (
      id           TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      keyword      TEXT,
      area         TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      TEXT NOT NULL,
      kind         TEXT NOT NULL,          -- 'APPLICATION_STATUS' | 'MODERATION'
      payload      TEXT NOT NULL,          -- JSON com os campos específicos
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id           TEXT PRIMARY KEY,
      target_type  TEXT NOT NULL CHECK (target_type IN ('JOB','COMPANY','USER')),
      target_id    TEXT NOT NULL,
      target_label TEXT NOT NULL,
      reporter_id  TEXT NOT NULL,
      reason       TEXT NOT NULL,
      details      TEXT,
      status       TEXT NOT NULL DEFAULT 'PENDING'
                     CHECK (status IN ('PENDING','REVIEWED','ARCHIVED')),
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moderation_audit (
      id           TEXT PRIMARY KEY,
      admin_id     TEXT NOT NULL,
      admin_name   TEXT NOT NULL,
      target_type  TEXT NOT NULL,
      target_id    TEXT NOT NULL,
      target_label TEXT NOT NULL,
      action       TEXT NOT NULL,
      reason       TEXT,
      created_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS privacy_consents (
      user_id     TEXT PRIMARY KEY,
      version     TEXT NOT NULL,
      accepted_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_status      ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_company     ON jobs(company_id);
    CREATE INDEX IF NOT EXISTS idx_apps_candidate   ON applications(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_apps_job         ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user       ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports(status);
  `);
}

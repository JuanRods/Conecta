-- =============================================================================
-- Conecta Inclusão — Schema PostgreSQL
-- Alinhado ao modelo de dados do design (.kiro/specs/conecta-inclusao/design.md)
--
-- LGPD/NF2: dados sensíveis do candidato (tipo de deficiência e acomodações)
-- ficam em `candidate_profiles.sensitive_enc`, CIFRADOS pela aplicação — o banco
-- nunca vê o conteúdo em claro. O acesso é auditável via moderation_actions.
-- =============================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ----------------------------- Tipos enumerados ------------------------------

CREATE TYPE user_role           AS ENUM ('CANDIDATE', 'COMPANY', 'ADMIN');
CREATE TYPE user_status         AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE profile_visibility  AS ENUM ('PUBLIC', 'APPLIED_ONLY', 'PRIVATE');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');
CREATE TYPE job_status          AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'CLOSED');
CREATE TYPE job_modality        AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');
CREATE TYPE job_level           AS ENUM ('JUNIOR', 'MID', 'SENIOR');
CREATE TYPE application_status  AS ENUM ('SENT', 'REVIEW', 'INTERVIEW', 'FINISHED');
CREATE TYPE report_target       AS ENUM ('JOB', 'COMPANY', 'USER');
CREATE TYPE report_status       AS ENUM ('PENDING', 'REVIEWED', 'ARCHIVED');

-- --------------------------------- Usuários ----------------------------------

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          user_role   NOT NULL,
  status        user_status NOT NULL DEFAULT 'ACTIVE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role ON users (role);

-- ---------------------------- Perfil do candidato ----------------------------

CREATE TABLE candidate_profiles (
  user_id            UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  headline           TEXT NOT NULL DEFAULT '',
  bio                TEXT NOT NULL DEFAULT '',
  skills             TEXT[] NOT NULL DEFAULT '{}',
  experience         TEXT NOT NULL DEFAULT '',
  education          TEXT NOT NULL DEFAULT '',
  salary_expectation TEXT,
  visibility         profile_visibility NOT NULL DEFAULT 'APPLIED_ONLY',
  -- Metadados do currículo (o binário fica em armazenamento de arquivos)
  resume_name        TEXT,
  resume_type        TEXT,
  resume_size        INTEGER,
  resume_uploaded_at TIMESTAMPTZ,
  -- Bloco sensível CIFRADO pela aplicação (LGPD/NF2)
  sensitive_enc      TEXT NOT NULL DEFAULT '',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------- Empresas -----------------------------------

CREATE TABLE companies (
  user_id                UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  cnpj                   TEXT NOT NULL,
  sector                 TEXT NOT NULL DEFAULT '',
  description            TEXT NOT NULL DEFAULT '',
  inclusion_policy       TEXT NOT NULL DEFAULT '',
  accessibility_features TEXT[] NOT NULL DEFAULT '{}',
  website                TEXT,
  verification_status    verification_status NOT NULL DEFAULT 'PENDING',
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_verification ON companies (verification_status);

-- ---------------------------------- Vagas ------------------------------------

CREATE TABLE jobs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  location               TEXT NOT NULL DEFAULT '',
  modality               job_modality NOT NULL,
  level                  job_level    NOT NULL,
  area                   TEXT NOT NULL,
  accessibility_features TEXT[] NOT NULL DEFAULT '{}',
  status                 job_status NOT NULL DEFAULT 'PENDING',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at           TIMESTAMPTZ
);

-- A busca pública filtra por status e ordena por publicação
CREATE INDEX idx_jobs_status      ON jobs (status);
CREATE INDEX idx_jobs_company     ON jobs (company_id);
CREATE INDEX idx_jobs_published   ON jobs (published_at DESC NULLS LAST);
CREATE INDEX idx_jobs_features    ON jobs USING GIN (accessibility_features);

-- ------------------------------- Candidaturas --------------------------------

CREATE TABLE applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id                UUID NOT NULL REFERENCES jobs (id)  ON DELETE CASCADE,
  candidate_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status                application_status NOT NULL DEFAULT 'SENT',
  -- Acomodações compartilhadas SOMENTE com consentimento explícito (NF2).
  -- NULL = o candidato não autorizou o compartilhamento.
  shared_accommodations TEXT[],
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);

CREATE INDEX idx_applications_candidate ON applications (candidate_id);
CREATE INDEX idx_applications_job       ON applications (job_id);

-- --------------------------- Favoritos e alertas -----------------------------

CREATE TABLE favorites (
  candidate_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES jobs (id)  ON DELETE CASCADE,
  saved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (candidate_id, job_id)
);

CREATE TABLE job_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  keyword      TEXT,
  area         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (keyword IS NOT NULL OR area IS NOT NULL)
);

CREATE INDEX idx_alerts_candidate ON job_alerts (candidate_id);

-- -------------------------------- Denúncias ----------------------------------

CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type  report_target NOT NULL,
  target_id    TEXT NOT NULL,
  target_label TEXT NOT NULL,
  reporter_id  UUID REFERENCES users (id) ON DELETE SET NULL,
  reason       TEXT NOT NULL,
  details      TEXT,
  status       report_status NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports (status);

-- ------------------- Auditoria de moderação (M1.4 / NF8) ---------------------

CREATE TABLE moderation_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES users (id) ON DELETE SET NULL,
  admin_name   TEXT NOT NULL,
  target_type  TEXT NOT NULL,
  target_id    TEXT NOT NULL,
  target_label TEXT NOT NULL,
  action       TEXT NOT NULL,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_created ON moderation_actions (created_at DESC);

-- ------------------------------ Notificações ---------------------------------

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  payload    JSONB NOT NULL DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);

-- --------------------- Consentimento LGPD (NF2 / Fase 7) ---------------------

CREATE TABLE consents (
  user_id     UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------- Feed de publicações (posts) -------------------------
-- Rede social da comunidade: qualquer usuário autenticado pode publicar,
-- curtir e comentar. Curtidas ficam numa tabela de junção (um registro por
-- pessoa/post) para impedir curtida duplicada. A exclusão do autor remove em
-- cascata suas publicações, curtidas e comentários.

CREATE TABLE posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_created ON posts (created_at DESC);
CREATE INDEX idx_posts_author  ON posts (author_id);

CREATE TABLE post_likes (
  post_id  UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  user_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  liked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post ON post_comments (post_id, created_at);

-- --------------------- Campanhas / ações das empresas ------------------------
-- Cards amplos que divulgam uma CAMPANHA ou AÇÃO inclusiva da empresa
-- (ex.: programa de contratação afirmativa, mutirão de acessibilidade).
-- Fluxo: a empresa cria (status PENDING) e o administrador aprova ou recusa.
-- Apenas campanhas APPROVED aparecem na vitrine pública "Para empresas".

CREATE TYPE campaign_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  subtitle      TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL,
  call_to_action TEXT NOT NULL DEFAULT '',
  link          TEXT,
  tag           TEXT NOT NULL DEFAULT '',
  status        campaign_status NOT NULL DEFAULT 'PENDING',
  review_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at  TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_status  ON campaigns (status);
CREATE INDEX idx_campaigns_company ON campaigns (company_id);
CREATE INDEX idx_campaigns_published ON campaigns (published_at DESC NULLS LAST);

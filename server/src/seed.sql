-- =============================================================================
-- Conecta Inclusão — Dados de demonstração (seed)
--
-- Conteúdo: 1 administrador, 5 empresas, 5 candidatos, 10 vagas (em vários
-- status) e candidaturas cobrindo TODOS os estados (SENT, REVIEW, INTERVIEW,
-- FINISHED), além de favoritos, alertas, denúncias, auditoria e consentimentos.
--
-- Senha de todas as contas de demonstração: Senha@123
-- (exceto o admin: Admin@123). Os hashes abaixo são **bcrypt** (hash + salt),
-- compatíveis com a verificação real da API (auth.ts).
--   Admin@123 -> $2b$10$4bS76bslFHdXfZ.3UipA5.GS0523vQqWYQbjfJdtybnXltipXe21O
--   Senha@123 -> $2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC
-- =============================================================================

-- IDs fixos para facilitar a conferência manual e os testes.
INSERT INTO users (id, name, email, password_hash, role, status, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'admin@conectainclusao.org', '$2b$10$4bS76bslFHdXfZ.3UipA5.GS0523vQqWYQbjfJdtybnXltipXe21O', 'ADMIN', 'ACTIVE', now() - interval '120 days'),

  -- ------------------------------ 5 empresas ------------------------------
  ('00000000-0000-0000-0000-0000000000c1', 'Marina Alves (TechInclui)',   'rh@techinclui.com.br',    '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'COMPANY', 'ACTIVE', now() - interval '90 days'),
  ('00000000-0000-0000-0000-0000000000c2', 'Paulo Reis (CuidarBem)',      'rh@cuidarbem.com.br',     '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'COMPANY', 'ACTIVE', now() - interval '80 days'),
  ('00000000-0000-0000-0000-0000000000c3', 'Fernanda Luz (LogAccess)',    'rh@logaccess.com.br',     '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'COMPANY', 'ACTIVE', now() - interval '70 days'),
  ('00000000-0000-0000-0000-0000000000c4', 'Caio Nunes (EduLivre)',       'rh@edulivre.com.br',      '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'COMPANY', 'ACTIVE', now() - interval '60 days'),
  ('00000000-0000-0000-0000-0000000000c5', 'Bruna Dias (AgroSempre)',     'rh@agrosempre.com.br',    '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'COMPANY', 'ACTIVE', now() - interval '50 days'),

  -- ----------------------------- 5 candidatos -----------------------------
  ('00000000-0000-0000-0000-0000000000d1', 'Ana Souza',        'ana.souza@exemplo.com',     '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'CANDIDATE', 'ACTIVE',    now() - interval '45 days'),
  ('00000000-0000-0000-0000-0000000000d2', 'Bruno Carvalho',   'bruno.carvalho@exemplo.com','$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'CANDIDATE', 'ACTIVE',    now() - interval '40 days'),
  ('00000000-0000-0000-0000-0000000000d3', 'Carla Mendes',     'carla.mendes@exemplo.com',  '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'CANDIDATE', 'ACTIVE',    now() - interval '35 days'),
  ('00000000-0000-0000-0000-0000000000d4', 'Diego Ramos',      'diego.ramos@exemplo.com',   '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'CANDIDATE', 'ACTIVE',    now() - interval '30 days'),
  -- conta suspensa, para exercitar o bloqueio de login (M2.5)
  ('00000000-0000-0000-0000-0000000000d5', 'Elisa Prado',      'elisa.prado@exemplo.com',   '$2b$10$jtbEa/R3KrPUwBu1xitW/uWaln/Fwcdi13hsR1K1G4D2nHzpE59TC', 'CANDIDATE', 'SUSPENDED', now() - interval '25 days');

-- ----------------------------- Perfis de empresa -----------------------------
-- Mistura de status de verificação: 3 verificadas, 1 pendente, 1 recusada.
INSERT INTO companies (user_id, name, cnpj, sector, description, inclusion_policy, accessibility_features, website, verification_status) VALUES
  ('00000000-0000-0000-0000-0000000000c1', 'TechInclui', '11.222.333/0001-81', 'Tecnologia',
   'Produtos digitais acessíveis por padrão, com equipes diversas.',
   'Metas de 10% de PcD no quadro, trilha de carreira acompanhada e acessibilidade digital como critério de qualidade.',
   '{SCREEN_READER,FLEXIBLE_HOURS,ASSISTIVE_TECH,INCLUSIVE_ONBOARDING}', 'https://techinclui.com.br', 'VERIFIED'),

  ('00000000-0000-0000-0000-0000000000c2', 'CuidarBem Saúde', '22.333.444/0001-72', 'Saúde',
   'Rede de clínicas com atendimento humanizado e acessível.',
   'Intérpretes de Libras em unidades, materiais em formato acessível e capacitação anual das equipes.',
   '{SIGN_LANGUAGE,WHEELCHAIR_ACCESS,INCLUSIVE_ONBOARDING}', 'https://cuidarbem.com.br', 'VERIFIED'),

  ('00000000-0000-0000-0000-0000000000c3', 'LogAccess', '33.444.555/0001-63', 'Logística',
   'Operação logística com centros de distribuição adaptados.',
   'Todos os centros com acesso para cadeirantes, estações ajustáveis e jornada flexível.',
   '{WHEELCHAIR_ACCESS,ASSISTIVE_TECH,FLEXIBLE_HOURS}', 'https://logaccess.com.br', 'VERIFIED'),

  ('00000000-0000-0000-0000-0000000000c4', 'EduLivre', '44.555.666/0001-54', 'Educação',
   'Plataforma de ensino com conteúdo acessível.',
   'Conteúdo audiodescrito e legendado; processo seletivo com acomodações sob demanda.',
   '{SCREEN_READER,SIGN_LANGUAGE,INCLUSIVE_ONBOARDING}', 'https://edulivre.com.br', 'PENDING'),

  ('00000000-0000-0000-0000-0000000000c5', 'AgroSempre', '55.666.777/0001-45', 'Agronegócio',
   'Cooperativa agrícola em processo de adequação de acessibilidade.',
   'Programa de inclusão em estruturação.',
   '{FLEXIBLE_HOURS}', NULL, 'REJECTED');

-- ---------------------------- Perfis de candidato ----------------------------
-- `sensitive_enc` guarda o bloco sensível cifrado pela aplicação (base64 no
-- mock didático). Conteúdos em claro, apenas para referência de quem lê o seed:
--   Ana   -> {"disabilityType":"VISUAL","accommodations":["SCREEN_READER","ASSISTIVE_TECH"]}
--   Bruno -> {"disabilityType":"HEARING","accommodations":["SIGN_LANGUAGE"]}
--   Carla -> {"disabilityType":"PHYSICAL","accommodations":["WHEELCHAIR_ACCESS","FLEXIBLE_HOURS"]}
--   Diego -> {"disabilityType":"PSYCHOSOCIAL","accommodations":["FLEXIBLE_HOURS","INCLUSIVE_ONBOARDING"]}
--   Elisa -> {"accommodations":[]}  (preferiu não informar)
INSERT INTO candidate_profiles
  (user_id, headline, bio, skills, experience, education, salary_expectation, visibility, resume_name, resume_type, resume_size, resume_uploaded_at, sensitive_enc)
VALUES
  ('00000000-0000-0000-0000-0000000000d1',
   'Pessoa Desenvolvedora Front-end', 'Construo interfaces acessíveis há 5 anos, com foco em WCAG e leitores de tela.',
   '{React,TypeScript,Acessibilidade,WCAG}', '5 anos em produtos web, sendo 3 com foco em acessibilidade.',
   'Tecnóloga em Análise e Desenvolvimento de Sistemas', 'R$ 8.000 - R$ 10.000', 'PUBLIC',
   'ana-souza-cv.pdf', 'application/pdf', 182400, now() - interval '20 days',
   'enc:eyJkaXNhYmlsaXR5VHlwZSI6IlZJU1VBTCIsImFjY29tbW9kYXRpb25zIjpbIlNDUkVFTl9SRUFERVIiLCJBU1NJU1RJVkVfVEVDSCJdfQ=='),

  ('00000000-0000-0000-0000-0000000000d2',
   'Analista de Atendimento bilíngue (Libras)', 'Atendimento ao cliente com fluência em Libras e Português.',
   '{Atendimento,Libras,CRM}', '4 anos em centrais de atendimento e suporte.',
   'Bacharel em Letras - Libras', 'R$ 3.500 - R$ 4.500', 'APPLIED_ONLY',
   'bruno-carvalho-cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 96000, now() - interval '18 days',
   'enc:eyJkaXNhYmlsaXR5VHlwZSI6IkhFQVJJTkciLCJhY2NvbW1vZGF0aW9ucyI6WyJTSUdOX0xBTkdVQUdFIl19'),

  ('00000000-0000-0000-0000-0000000000d3',
   'Analista Financeira Sênior', 'Planejamento e análise financeira com forte domínio de modelagem.',
   '{Finanças,Excel,"Power BI",FP&A}', '8 anos em controladoria e FP&A.',
   'MBA em Finanças Corporativas', 'R$ 12.000 - R$ 15.000', 'PUBLIC',
   NULL, NULL, NULL, NULL,
   'enc:eyJkaXNhYmlsaXR5VHlwZSI6IlBIWVNJQ0FMIiwiYWNjb21tb2RhdGlvbnMiOlsiV0hFRUxDSEFJUl9BQ0NFU1MiLCJGTEVYSUJMRV9IT1VSUyJdfQ=='),

  ('00000000-0000-0000-0000-0000000000d4',
   'Pessoa Designer de Produto (UX)', 'Pesquisa e design de produto com foco em inclusão.',
   '{UX,"Design System",Figma,"Pesquisa com usuários"}', '6 anos em design de produto digital.',
   'Bacharel em Design', 'R$ 9.000 - R$ 11.000', 'APPLIED_ONLY',
   'diego-ramos-cv.pdf', 'application/pdf', 204800, now() - interval '12 days',
   'enc:eyJkaXNhYmlsaXR5VHlwZSI6IlBTWUNIT1NPQ0lBTCIsImFjY29tbW9kYXRpb25zIjpbIkZMRVhJQkxFX0hPVVJTIiwiSU5DTFVTSVZFX09OQk9BUkRJTkciXX0='),

  ('00000000-0000-0000-0000-0000000000d5',
   'Assistente Administrativa', 'Rotinas administrativas e apoio a equipes.',
   '{Administração,Pacote Office}', '2 anos em rotinas administrativas.',
   'Ensino médio completo', NULL, 'PRIVATE',
   NULL, NULL, NULL, NULL,
   'enc:eyJhY2NvbW1vZGF0aW9ucyI6W119');

-- ---------------------------------- Vagas ------------------------------------
-- 10 vagas: 6 APPROVED (aparecem na busca pública), 2 PENDING (fila de
-- moderação), 1 DRAFT e 1 CLOSED — cobrindo o ciclo de vida completo.
INSERT INTO jobs (id, company_id, title, description, location, modality, level, area, accessibility_features, status, created_at, published_at) VALUES
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000c1',
   'Pessoa Desenvolvedora Front-end',
   'Atuação em produtos web acessíveis (WCAG 2.1 AA) com React e TypeScript. Você trabalhará com uma equipe que prioriza acessibilidade desde o design, com revisões de código focadas em semântica e navegação por teclado.',
   'São Paulo, SP', 'REMOTE', 'MID', 'Tecnologia',
   '{SCREEN_READER,FLEXIBLE_HOURS,ASSISTIVE_TECH,INCLUSIVE_ONBOARDING}', 'APPROVED', now() - interval '25 days', now() - interval '24 days'),

  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000c2',
   'Analista de Atendimento (Libras)',
   'Atendimento humanizado a clientes, com suporte em Libras. Oferecemos intérprete, materiais acessíveis e integração inclusiva para novas pessoas na equipe.',
   'Belo Horizonte, MG', 'HYBRID', 'JUNIOR', 'Atendimento',
   '{SIGN_LANGUAGE,INCLUSIVE_ONBOARDING,FLEXIBLE_HOURS}', 'APPROVED', now() - interval '22 days', now() - interval '21 days'),

  ('00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000c3',
   'Pessoa Analista Financeira Sênior',
   'Planejamento e análise financeira em ambiente totalmente acessível, com acesso físico para cadeirantes e estações de trabalho adaptadas.',
   'Rio de Janeiro, RJ', 'ONSITE', 'SENIOR', 'Financeiro',
   '{WHEELCHAIR_ACCESS,ASSISTIVE_TECH,INCLUSIVE_ONBOARDING}', 'APPROVED', now() - interval '20 days', now() - interval '19 days'),

  ('00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000c1',
   'Pessoa Designer de Produto (UX) Acessível',
   'Projetos de experiência com foco em inclusão: pesquisa com pessoas com deficiência, protótipos testáveis por leitor de tela e horário flexível.',
   'Remoto (Brasil)', 'REMOTE', 'SENIOR', 'Design',
   '{SCREEN_READER,FLEXIBLE_HOURS,ASSISTIVE_TECH}', 'APPROVED', now() - interval '18 days', now() - interval '17 days'),

  ('00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000c3',
   'Assistente de Logística',
   'Apoio às rotinas do centro de distribuição, com equipamentos adaptados e jornada flexível.',
   'Curitiba, PR', 'ONSITE', 'JUNIOR', 'Logística',
   '{WHEELCHAIR_ACCESS,FLEXIBLE_HOURS}', 'APPROVED', now() - interval '15 days', now() - interval '14 days'),

  ('00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000c2',
   'Pessoa Recepcionista',
   'Recepção e acolhimento de pacientes em unidade com acessibilidade plena e equipe capacitada.',
   'Belo Horizonte, MG', 'ONSITE', 'JUNIOR', 'Atendimento',
   '{WHEELCHAIR_ACCESS,SIGN_LANGUAGE,INCLUSIVE_ONBOARDING}', 'APPROVED', now() - interval '12 days', now() - interval '11 days'),

  -- Em moderação (não aparecem na busca pública)
  ('00000000-0000-0000-0000-0000000000f7', '00000000-0000-0000-0000-0000000000c4',
   'Pessoa Educadora de Conteúdo',
   'Produção de material didático acessível para plataforma de ensino, com audiodescrição e legendagem.',
   'Curitiba, PR', 'HYBRID', 'MID', 'Educação',
   '{SCREEN_READER,INCLUSIVE_ONBOARDING}', 'PENDING', now() - interval '5 days', NULL),

  ('00000000-0000-0000-0000-0000000000f8', '00000000-0000-0000-0000-0000000000c5',
   'Auxiliar Administrativo',
   'Rotinas administrativas na cooperativa, com horário flexível.',
   'Ribeirão Preto, SP', 'ONSITE', 'JUNIOR', 'Administração',
   '{FLEXIBLE_HOURS}', 'PENDING', now() - interval '3 days', NULL),

  -- Rascunho e encerrada
  ('00000000-0000-0000-0000-0000000000f9', '00000000-0000-0000-0000-0000000000c1',
   'Pessoa Engenheira de Dados',
   'Rascunho em elaboração: pipelines de dados e governança.',
   'Remoto (Brasil)', 'REMOTE', 'SENIOR', 'Tecnologia',
   '{SCREEN_READER,FLEXIBLE_HOURS}', 'DRAFT', now() - interval '2 days', NULL),

  ('00000000-0000-0000-0000-0000000000fa', '00000000-0000-0000-0000-0000000000c2',
   'Técnico(a) de Enfermagem',
   'Processo encerrado — vaga preenchida.',
   'Belo Horizonte, MG', 'ONSITE', 'MID', 'Saúde',
   '{WHEELCHAIR_ACCESS,INCLUSIVE_ONBOARDING}', 'CLOSED', now() - interval '60 days', now() - interval '59 days');

-- ------------------------------- Candidaturas --------------------------------
-- Cobertura de TODOS os estados do fluxo. `shared_accommodations` preenchido
-- apenas quando o candidato consentiu em compartilhar (NF2); NULL caso contrário.
INSERT INTO applications (id, job_id, candidate_id, status, shared_accommodations, created_at) VALUES
  -- SENT (enviada)
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d1', 'SENT',      '{SCREEN_READER,ASSISTIVE_TECH}',          now() - interval '10 days'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000f5', '00000000-0000-0000-0000-0000000000d4', 'SENT',      NULL,                                      now() - interval '9 days'),

  -- REVIEW (em análise)
  ('00000000-0000-0000-0000-0000000000e3', '00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000d2', 'REVIEW',    '{SIGN_LANGUAGE}',                         now() - interval '8 days'),
  ('00000000-0000-0000-0000-0000000000e4', '00000000-0000-0000-0000-0000000000f4', '00000000-0000-0000-0000-0000000000d4', 'REVIEW',    '{FLEXIBLE_HOURS,INCLUSIVE_ONBOARDING}',   now() - interval '7 days'),

  -- INTERVIEW (entrevista)
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-0000000000f3', '00000000-0000-0000-0000-0000000000d3', 'INTERVIEW', '{WHEELCHAIR_ACCESS,FLEXIBLE_HOURS}',      now() - interval '6 days'),
  ('00000000-0000-0000-0000-0000000000e6', '00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-0000000000d4', 'INTERVIEW', NULL,                                      now() - interval '5 days'),

  -- FINISHED (finalizada)
  ('00000000-0000-0000-0000-0000000000e7', '00000000-0000-0000-0000-0000000000fa', '00000000-0000-0000-0000-0000000000d3', 'FINISHED',  '{WHEELCHAIR_ACCESS}',                     now() - interval '40 days'),
  ('00000000-0000-0000-0000-0000000000e8', '00000000-0000-0000-0000-0000000000f6', '00000000-0000-0000-0000-0000000000d2', 'FINISHED',  NULL,                                      now() - interval '30 days');

-- --------------------------- Favoritos e alertas -----------------------------
INSERT INTO favorites (candidate_id, job_id, saved_at) VALUES
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f4', now() - interval '9 days'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000f2', now() - interval '8 days'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000f6', now() - interval '7 days'),
  ('00000000-0000-0000-0000-0000000000d3', '00000000-0000-0000-0000-0000000000f3', now() - interval '6 days'),
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-0000000000f1', now() - interval '5 days');

INSERT INTO job_alerts (candidate_id, keyword, area, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000d1', 'front-end', 'Tecnologia',  now() - interval '15 days'),
  ('00000000-0000-0000-0000-0000000000d2', 'libras',    'Atendimento', now() - interval '14 days'),
  ('00000000-0000-0000-0000-0000000000d3', NULL,        'Financeiro',  now() - interval '13 days'),
  ('00000000-0000-0000-0000-0000000000d4', 'design',    NULL,          now() - interval '12 days'),
  ('00000000-0000-0000-0000-0000000000d4', 'remoto',    'Tecnologia',  now() - interval '11 days');

-- -------------------------------- Denúncias ----------------------------------
INSERT INTO reports (target_type, target_id, target_label, reporter_id, reason, details, status, created_at) VALUES
  ('JOB',     '00000000-0000-0000-0000-0000000000f8', 'Auxiliar Administrativo', '00000000-0000-0000-0000-0000000000d1', 'INACCESSIBLE',   'A descrição não informa se o local tem acesso para cadeirantes.', 'PENDING',  now() - interval '4 days'),
  ('COMPANY', '00000000-0000-0000-0000-0000000000c5', 'AgroSempre',              '00000000-0000-0000-0000-0000000000d3', 'FALSE_INFO',     'A política de inclusão descrita não corresponde à realidade.',     'PENDING',  now() - interval '3 days'),
  ('JOB',     '00000000-0000-0000-0000-0000000000f7', 'Pessoa Educadora',        '00000000-0000-0000-0000-0000000000d2', 'DISCRIMINATION', 'Termo capacitista no texto da vaga.',                              'PENDING',  now() - interval '2 days'),
  ('JOB',     '00000000-0000-0000-0000-0000000000f5', 'Assistente de Logística', '00000000-0000-0000-0000-0000000000d4', 'SPAM',           'Parece duplicada.',                                                'ARCHIVED', now() - interval '10 days'),
  ('USER',    '00000000-0000-0000-0000-0000000000d5', 'Elisa Prado',             '00000000-0000-0000-0000-0000000000d1', 'OTHER',          'Mensagens inadequadas no processo.',                               'REVIEWED', now() - interval '20 days');

-- ----------------------- Auditoria de moderação (NF8) ------------------------
INSERT INTO moderation_actions (admin_id, admin_name, target_type, target_id, target_label, action, reason, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'JOB',     '00000000-0000-0000-0000-0000000000f1', 'Pessoa Desenvolvedora Front-end', 'APPROVE',             NULL,                                  now() - interval '24 days'),
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'JOB',     '00000000-0000-0000-0000-0000000000f2', 'Analista de Atendimento (Libras)', 'APPROVE',             NULL,                                  now() - interval '21 days'),
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'COMPANY', '00000000-0000-0000-0000-0000000000c1', 'TechInclui',                      'VERIFY',              NULL,                                  now() - interval '85 days'),
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'COMPANY', '00000000-0000-0000-0000-0000000000c5', 'AgroSempre',                      'REJECT_VERIFICATION', 'Documentação de acessibilidade insuficiente.', now() - interval '45 days'),
  ('00000000-0000-0000-0000-0000000000a1', 'Administração Conecta', 'USER',    '00000000-0000-0000-0000-0000000000d5', 'Elisa Prado',                     'SUSPEND_USER',        'Conduta inadequada reportada por outros usuários.', now() - interval '20 days');

-- ------------------------------ Notificações ---------------------------------
INSERT INTO notifications (user_id, type, payload, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000d2', 'APPLICATION_STATUS', '{"jobTitle":"Analista de Atendimento (Libras)","status":"REVIEW"}',   now() - interval '8 days'),
  ('00000000-0000-0000-0000-0000000000d3', 'APPLICATION_STATUS', '{"jobTitle":"Pessoa Analista Financeira Sênior","status":"INTERVIEW"}', now() - interval '6 days'),
  ('00000000-0000-0000-0000-0000000000d4', 'APPLICATION_STATUS', '{"jobTitle":"Pessoa Designer de Produto (UX) Acessível","status":"REVIEW"}', now() - interval '7 days'),
  ('00000000-0000-0000-0000-0000000000c1', 'MODERATION',         '{"message":"Sua vaga \"Pessoa Desenvolvedora Front-end\" foi aprovada e publicada."}', now() - interval '24 days'),
  ('00000000-0000-0000-0000-0000000000c5', 'MODERATION',         '{"message":"A verificação da sua empresa foi recusada."}', now() - interval '45 days');

-- --------------------------- Consentimentos LGPD -----------------------------
INSERT INTO consents (user_id, version, accepted_at) VALUES
  ('00000000-0000-0000-0000-0000000000d1', '2026-10-15', now() - interval '20 days'),
  ('00000000-0000-0000-0000-0000000000d2', '2026-10-15', now() - interval '18 days'),
  ('00000000-0000-0000-0000-0000000000d3', '2026-10-15', now() - interval '16 days'),
  ('00000000-0000-0000-0000-0000000000d4', '2026-10-15', now() - interval '14 days');

-- ----------------------- Feed de publicações (posts) -------------------------
INSERT INTO posts (id, author_id, content, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1',
   'Estamos com vagas abertas para pessoas desenvolvedoras front-end! Nosso time trabalha com acessibilidade desde o design (WCAG 2.1 AA) e oferece horário flexível e tecnologia assistiva. Bora construir uma web para todas as pessoas? 💜',
   now() - interval '2 days'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1',
   'Dica da semana: ao se candidatar, você pode pedir acomodações para o processo seletivo (intérprete de Libras, tempo adicional, material em alto contraste). Informar uma deficiência é opcional e sigiloso. Seus direitos vêm primeiro. ♿',
   now() - interval '3 days'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000d2',
   'Depois de alguns meses buscando, consegui uma vaga afirmativa para PcD por aqui! Obrigado à comunidade pelas dicas de currículo acessível. Não desistam — a vaga certa existe. 🚀',
   now() - interval '4 days');

INSERT INTO post_likes (post_id, user_id) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000d2'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000d1'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c1');

INSERT INTO post_comments (post_id, author_id, content, created_at) VALUES
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000d1',
   'Que oportunidade incrível! Acabei de me candidatar. 🙌', now() - interval '2 days' + interval '2 hours'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000c1',
   'Parabéns! Sucesso nessa nova etapa. 👏', now() - interval '4 days' + interval '1 hour');

-- --------------------- Campanhas / ações das empresas ------------------------
-- 3 campanhas APPROVED (aparecem na vitrine pública) + 1 PENDING (fila de
-- moderação) + 1 REJECTED (histórico da empresa).
INSERT INTO campaigns (id, company_id, title, subtitle, description, call_to_action, link, tag, status, review_reason, created_at, published_at) VALUES
  ('00000000-0000-0000-0000-00000000a001', '00000000-0000-0000-0000-0000000000c1',
   'Programa Talentos sem Barreiras',
   'TechInclui · Contratação afirmativa de pessoas com deficiência',
   'Abrimos 20 vagas afirmativas em tecnologia com trilha de mentoria, acessibilidade digital garantida (WCAG 2.1 AA) e horário flexível. Todo o processo seletivo oferece intérprete de Libras, materiais em alto contraste e tempo adicional mediante solicitação.',
   'Quero participar do programa', 'https://techinclui.com.br/talentos', 'Contratação afirmativa',
   'APPROVED', NULL, now() - interval '12 days', now() - interval '11 days'),

  ('00000000-0000-0000-0000-00000000a002', '00000000-0000-0000-0000-0000000000c2',
   'Mutirão de Saúde Acessível',
   'CuidarBem Saúde · Ação comunitária',
   'Durante todo o mês, nossas unidades oferecem atendimento gratuito com acessibilidade plena: rampas, intérpretes de Libras e profissionais capacitados em comunicação inclusiva. Uma ação para aproximar o cuidado de quem mais precisa.',
   'Agendar atendimento', 'https://cuidarbem.com.br/mutirao', 'Ação comunitária',
   'APPROVED', NULL, now() - interval '9 days', now() - interval '8 days'),

  ('00000000-0000-0000-0000-00000000a003', '00000000-0000-0000-0000-0000000000c3',
   'Centros de Distribuição 100% Acessíveis',
   'LogAccess · Compromisso de acessibilidade',
   'Concluímos a adaptação de todos os nossos centros de distribuição: acesso para cadeirantes, estações de trabalho ajustáveis e sinalização inclusiva. Conheça a transformação e venha fazer parte do nosso time.',
   'Conhecer a iniciativa', NULL, 'Compromisso',
   'APPROVED', NULL, now() - interval '6 days', now() - interval '5 days'),

  ('00000000-0000-0000-0000-00000000a004', '00000000-0000-0000-0000-0000000000c4',
   'Bolsas de Capacitação Inclusiva',
   'EduLivre · Educação',
   'Vamos oferecer 100 bolsas integrais em cursos de tecnologia com conteúdo audiodescrito e legendado para pessoas com deficiência. As inscrições abrem em breve.',
   'Entrar na lista de espera', NULL, 'Educação',
   'PENDING', NULL, now() - interval '1 day', NULL),

  ('00000000-0000-0000-0000-00000000a005', '00000000-0000-0000-0000-0000000000c5',
   'Campanha Agro Inclusivo',
   'AgroSempre · Em revisão',
   'Proposta de ação de inclusão no campo (texto ainda em ajustes de acessibilidade da descrição).',
   'Saiba mais', NULL, 'Ação comunitária',
   'REJECTED', 'A descrição precisa detalhar quais recursos de acessibilidade serão oferecidos.', now() - interval '15 days', NULL);

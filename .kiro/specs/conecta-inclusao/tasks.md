# Conecta Inclusão — Plano de Implementação

> Tarefas incrementais. Cada item referencia os requisitos atendidos. Comece pela base de acessibilidade, pois ela é transversal a tudo.

## Fase 0 — Fundação do Projeto

- [x] 0.1 Inicializar estrutura (frontend React+TS+Vite). _(NF3, NF5)_
- [x] 0.2 Configurar formatação (Prettier) e scripts de teste (Vitest). _(NF1)_
- [x] 0.3 Definir tokens de design e paleta do logo (roxo/teal/laranja). _(A4)_

## Fase 1 — Base de Acessibilidade (Transversal)

- [x] 1.1 Implementar layout com marcos semânticos e skip link. _(A1, A2)_
- [x] 1.2 Implementar alternância de tema claro/escuro com persistência e `prefers-color-scheme`. _(A4)_
- [x] 1.3 Criar componentes acessíveis base (botão, modal com focus trap, aria-live announcer). _(A1, A2, A3)_
- [x] 1.4 Implementar preferências de apresentação (fonte, alto contraste, `prefers-reduced-motion`). _(A6)_
- [x] 1.5 Implementar componente de **Navegação Guiada** (GuidedTour) reutilizável. _(A5)_
- [x] 1.6 Integrar auditoria axe nos testes e configurar jest-axe. _(NF1)_

> ⚠️ **Nota de ambiente:** o sandbox está em modo `INTEGRATIONS_ONLY` (sem acesso
> ao registro npm), então `npm install`, `npm run build` e `npm test` não puderam
> ser executados aqui. O código foi validado por parsing/formatação (Prettier).
> Em uma máquina com internet, rode `npm install && npm test` para executar a
> suíte de acessibilidade (jest-axe) já escrita em `src/test/`.

## Fase 2 — Autenticação e RBAC

- [x] 2.1 Modelar `User` e papéis (CANDIDATE/COMPANY/ADMIN); tipos de domínio. _(P1)_
- [x] 2.2 Serviço de registro (candidato/empresa), login e recuperação de senha. _(P1)_
- [x] 2.3 Autorização por papel (RBAC): AuthContext, hasRole e guarda de rota RequireAuth. _(P1, NF2)_
- [x] 2.4 Telas acessíveis de cadastro/login com validação, resumo de erros e foco. _(P1, A3)_
- [x] 2.5 Tour guiado do fluxo de cadastro. _(A5)_

> ⚠️ **Nota de ambiente:** sem backend no sandbox (INTEGRATIONS_ONLY), a
> autenticação usa um serviço MOCK que persiste em localStorage e simula os
> endpoints do design (`/auth/register`, `/auth/login`, `/auth/forgot-password`).
> A interface `authService` foi desenhada para troca direta por um cliente HTTP
> real. Um admin seed (`admin@conectainclusao.org` / `Admin@123`) é criado para
> permitir testar a moderação na Fase 6.

## Fase 3 — Área Pública e Busca

- [x] 3.1 Modelar `Job` e filtros (modalidade, área, nível, recursos de acessibilidade). _(P2)_
- [x] 3.2 Endpoint de busca pública (apenas vagas aprovadas). _(P2, M1)_
- [x] 3.3 Home com busca e resultados com `aria-live`. _(P2, A3)_
- [x] 3.4 Página de detalhe da vaga com selos de acessibilidade. _(P2)_
- [x] 3.5 Tour guiado de busca de vagas. _(A5)_

> **Fase 3 implementada.** Busca pública acessível em `src/pages/JobsPage.tsx`
> (filtros por palavra-chave, local, modalidade, nível, área e recursos de
> acessibilidade; resultados anunciados via `aria-live`; filtros refletidos na
> URL). Detalhe em `src/pages/JobDetailPage.tsx` com selos de acessibilidade,
> exigindo login apenas no momento da candidatura (P2.3). Domínio e serviço
> mock em `src/jobs/` — a busca expõe somente vagas `APPROVED` (P2.2 / M1).
> Testes em `src/test/jobs.test.tsx`. Ambiente agora com acesso a npm:
> `npm test` (18 testes) e `npm run build` passam.
>
> Correções de base aproveitadas nesta fase (regressões que impediam a suíte de
> rodar): guarda em `GuidedTour` para `scrollIntoView` ausente no jsdom,
> `AuthProvider` no teste de acessibilidade (Layout passou a usar `useAuth` na
> Fase 2) e declarações de tipo para `jest-axe`/`vitest` em `src/test/*.d.ts`.

## Fase 4 — Perfil Candidato

- [x] 4.1 Modelar `CandidateProfile` com dados sensíveis criptografados. _(C1, NF2)_
- [x] 4.2 Formulário de perfil com acomodações opcionais e controle de visibilidade. _(C1)_
- [x] 4.3 Upload de currículo em formato acessível. _(C1)_
- [x] 4.4 Candidatura a vagas com consentimento de compartilhamento. _(C2, NF2)_
- [x] 4.5 Painel "Minhas candidaturas" com status e feedback acessível. _(C2, A3)_
- [x] 4.6 Favoritos e alertas de novas vagas. _(C2)_
- [x] 4.7 Fluxo de denúncia de conteúdo. _(C3)_
- [x] 4.8 Tour guiado de candidatura. _(A5)_

> **Fase 4 implementada.** Domínio e serviços do candidato em `src/candidate/`
> (`profileService` com bloco sensível criptografado em repouso — NF2;
> `applicationService` para candidaturas/favoritos/alertas; `reportService`
> alimentando a fila de moderação da Fase 6). Painel do candidato com rotas
> aninhadas em `src/pages/candidate/`: visão geral, perfil (dados profissionais,
> acomodações opcionais e sigilosas, upload de currículo PDF/DOC/DOCX,
> visibilidade), minhas candidaturas (status com progresso acessível) e
> favoritos/alertas. O `JobDetailPage` ganhou candidatura real com consentimento
> de compartilhamento de acomodações (C2.2/NF2), favoritar e denunciar (C3).
> Tour guiado do perfil (A5). Testes em `src/test/candidate.test.tsx`.
> `npm test` (27 testes) e `npm run build` passam.

## Fase 5 — Perfil Empresa

- [x] 5.1 Modelar `Company` com status de verificação. _(E1)_
- [x] 5.2 Formulário de perfil da empresa (recursos de acessibilidade oferecidos). _(E1)_
- [x] 5.3 CRUD de vagas com envio automático à moderação (status PENDING). _(E2, M1)_
- [x] 5.4 Assistente de descrição inclusiva (dicas/verificação de linguagem). _(E2)_
- [x] 5.5 Gestão de candidaturas por vaga, com proteção de dados sensíveis. _(E3, NF2)_
- [x] 5.6 Atualização de status com notificação ao candidato. _(E3)_
- [x] 5.7 Tour guiado de publicação de vaga. _(A5)_

> **Fase 5 implementada.** Domínio e serviços em `src/company/`
> (`companyService` com status de verificação — empresa nasce PENDING, E1.3;
> `inclusiveLanguage` com verificação de linguagem e dicas, E2.2). O
> `jobService` ganhou o CRUD da empresa (criar → PENDING; editar vaga aprovada
> volta à moderação; pausar/encerrar/duplicar; remover). `applicationService`
> ganhou a visão da empresa (candidaturas por vaga, atualização de status com
> notificação ao candidato — E3.2), respeitando o consentimento de acomodações
> (E3.3/NF2). Painel da empresa com rotas aninhadas em `src/pages/company/`:
> visão geral, perfil, lista/gestão de vagas, formulário de vaga (com assistente
> inclusivo e tour guiado — A5) e candidaturas por vaga. Testes em
> `src/test/company.test.tsx`. `npm test` (37 testes) e `npm run build` passam.

## Fase 6 — Painel do Administrador (Moderação)

- [ ] 6.1 Fila de moderação (vagas pendentes, empresas a verificar, denúncias). _(M1)_
- [ ] 6.2 Ações aprovar/rejeitar/solicitar ajuste com justificativa + notificação. _(M1)_
- [ ] 6.3 Verificação de empresas. _(E1, M1)_
- [ ] 6.4 Gestão de denúncias (arquivar/remover/suspender). _(M2)_
- [ ] 6.5 Suspensão/reativação de contas com bloqueio de login. _(M2)_
- [ ] 6.6 Log de auditoria de todas as ações de moderação. _(M1, NF8)_
- [ ] 6.7 Painel de métricas e exportação CSV acessível. _(M3)_

## Fase 7 — Qualidade, LGPD e Lançamento

- [ ] 7.1 Testes E2E por perfil (Playwright) incluindo navegação só por teclado. _(A2, NF5)_
- [ ] 7.2 Validação manual com leitor de tela (NVDA/VoiceOver). _(A3, NF5)_
- [ ] 7.3 Integração do VLibras e verificação final de contraste nos dois temas. _(A4, NF6)_
- [ ] 7.4 Fluxos LGPD: consentimento, exportação e exclusão de dados. _(NF2)_
- [ ] 7.5 Otimização de desempenho (Core Web Vitals) e PWA/responsividade. _(NF3, NF4)_
- [ ] 7.6 Auditoria final de acessibilidade (WCAG 2.1 AA / e-MAG). _(NF1)_

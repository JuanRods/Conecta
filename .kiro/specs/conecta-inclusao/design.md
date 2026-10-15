# Conecta Inclusão — Documento de Design

## 1. Visão de Arquitetura

Aplicação web **SPA + API REST**, projetada "acessibilidade primeiro" (accessibility-first).

```
┌─────────────────────────────────────────────────────────┐
│                      Navegador / PWA                      │
│  SPA React — tema claro/escuro, navegação guiada, a11y    │
└───────────────┬───────────────────────────┬─────────────┘
                │ HTTPS (REST/JSON)           │
┌───────────────▼───────────────────────────▼─────────────┐
│                     API (Node.js)                         │
│  Auth/RBAC · Vagas · Candidaturas · Moderação · Relatórios│
└───────────────┬───────────────────────────┬─────────────┘
                │                             │
        ┌───────▼───────┐           ┌─────────▼─────────┐
        │  PostgreSQL   │           │  Armazenamento de  │
        │ (dados app)   │           │  arquivos (CVs)    │
        └───────────────┘           └───────────────────┘
```

### 1.1 Stack sugerida

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | **React + TypeScript + Vite** | Ecossistema maduro, forte suporte a11y |
| UI/Acessibilidade | **Radix UI** (ou React Aria) + CSS/Tailwind com tokens | Componentes acessíveis por padrão (foco, ARIA) |
| Estado | **TanStack Query** (dados) + Context (tema/preferências) | Cache e sincronização simples |
| Backend | **Node.js + Express/NestJS + TypeScript** | Produtividade e tipagem |
| Banco | **PostgreSQL** | Relacional, bom para RBAC e auditoria |
| Auth | JWT + refresh token, hash **argon2** | Padrão seguro |
| Testes a11y | **axe-core / jest-axe + Playwright** | Automação de acessibilidade |

> A stack é uma recomendação; o importante são os contratos e os requisitos de acessibilidade, independentes da tecnologia escolhida.

---

## 2. Perfis e Autorização (RBAC)

| Papel | Permissões principais |
|-------|----------------------|
| `GUEST` | Buscar e visualizar vagas aprovadas |
| `CANDIDATE` | Perfil, candidaturas, favoritos, denúncias |
| `COMPANY` | Perfil empresa, CRUD de vagas, gestão de candidaturas |
| `ADMIN` | Moderação, usuários, denúncias, relatórios |

Autorização aplicada no backend (middleware por papel) e refletida na UI (ocultar/desabilitar ações sem permissão).

---

## 3. Modelo de Dados (resumo)

```
User(id, email, passwordHash, role, status, createdAt)
 └─ 1:1 CandidateProfile(userId, headline, bio, skills[],
        disabilityType?, accommodations[], visibility, resumeFileId?)
 └─ 1:1 Company(userId, name, cnpj, sector, inclusionPolicy,
        accessibilityFeatures[], verificationStatus)

Job(id, companyId, title, description, modality, level, area,
    accessibilityFeatures[], status[DRAFT|PENDING|APPROVED|REJECTED|PAUSED|CLOSED],
    createdAt, publishedAt)

Application(id, jobId, candidateId,
    status[SENT|REVIEW|INTERVIEW|FINISHED], sharedAccommodations?, createdAt)

Report(id, targetType[JOB|COMPANY|USER], targetId, reporterId, reason, status)

ModerationAction(id, adminId, targetType, targetId, action, reason, createdAt)  // auditoria

Notification(id, userId, type, payload, readAt)
```

**Observação LGPD:** `disabilityType` e `accommodations` são **dados sensíveis** — criptografados em repouso, compartilhados com empresas apenas mediante consentimento (`sharedAccommodations` na candidatura).

---

## 4. Principais Endpoints da API

```
POST   /auth/register            # tipo: candidate | company
POST   /auth/login
POST   /auth/forgot-password

GET    /jobs                     # busca pública (filtros, só APPROVED p/ guest)
GET    /jobs/:id
POST   /jobs                     # COMPANY  -> status PENDING
PUT    /jobs/:id                 # COMPANY
POST   /applications             # CANDIDATE
GET    /applications/me          # CANDIDATE
GET    /companies/:id/applications# COMPANY
PATCH  /applications/:id/status  # COMPANY

POST   /reports                  # CANDIDATE/GUEST

# Moderação (ADMIN)
GET    /admin/moderation/queue
PATCH  /admin/jobs/:id/review     # approve | reject(reason)
PATCH  /admin/companies/:id/verify
GET    /admin/reports
PATCH  /admin/users/:id/status    # suspend | reactivate
GET    /admin/metrics
```

---

## 5. Design de Acessibilidade (componentes-chave)

### 5.1 Sistema de Temas (claro/escuro)

- Tokens de cor via CSS custom properties: `--color-bg`, `--color-fg`, `--color-primary`, etc.
- Atributo `data-theme="light|dark"` no `<html>`.
- Ordem de resolução: preferência salva (`localStorage`) → `prefers-color-scheme` → claro (padrão).
- **Paleta base** (do logo): roxo `#5B2A86`, teal `#2E8B9E`, laranja `#E8862E`, texto escuro `#1E2A4A`.
- Botão de tema no cabeçalho, `aria-pressed`, rótulo textual.

### 5.2 Componente de Navegação Guiada

```
GuidedTour
 ├─ passos declarados por rota (ex.: tour "candidatura")
 ├─ overlay com destaque do alvo (respeita prefers-reduced-motion)
 ├─ painel: título, descrição, [Anterior] [Pular] [Próximo] [Fechar]
 ├─ foco preso no painel; Esc encerra; estado anunciado via aria-live
 └─ progresso persistido para não repetir o guia já concluído
```

### 5.3 Formulários Acessíveis

- `label` sempre associado; instruções com `aria-describedby`.
- Validação em tempo real **não intrusiva**; resumo de erros no topo com links para os campos.
- Foco movido ao primeiro campo inválido no envio; erros anunciados.

### 5.4 Resultados de Busca

- Região `aria-live="polite"` anuncia a quantidade de resultados.
- Cada vaga é um `article` com cabeçalho, selos de acessibilidade e botão de ação.

### 5.5 Padrões globais

- Skip link "Pular para o conteúdo".
- Marcos: `header/nav/main/footer`.
- Foco visível reforçado; alvos de toque ≥ 44×44px.
- Suporte a VLibras (widget) e opção de alto contraste.

---

## 6. Estrutura de Telas por Perfil

**Público:** Home + busca · Detalhe da vaga · Login/Cadastro.

**Candidato:** Painel · Meu perfil · Buscar vagas · Minhas candidaturas · Favoritos/Alertas.

**Empresa:** Painel · Perfil da empresa · Minhas vagas (CRUD) · Candidaturas por vaga.

**Admin:** Painel/Métricas · Fila de moderação · Denúncias · Usuários · Auditoria.

---

## 7. Estratégia de Testes

| Tipo | Ferramenta | Cobertura |
|------|-----------|-----------|
| Unitário | Vitest/Jest | Lógica de componentes e serviços |
| Acessibilidade (automático) | jest-axe + axe no CI | Zero violações críticas por página |
| E2E + a11y | Playwright | Fluxos por perfil, navegação por teclado |
| Manual | NVDA/VoiceOver + navegação só por teclado | Validação com leitor de tela |
| Integração API | Supertest | Endpoints e RBAC |

**Definição de pronto (DoD) de acessibilidade:** nenhuma violação axe crítica; operável 100% por teclado; verificado com um leitor de tela; contraste AA em ambos os temas.

---

## 8. Segurança e LGPD

- RBAC no backend; princípio do menor privilégio.
- Dados sensíveis (deficiência) criptografados; acesso logado (auditoria).
- Consentimento explícito para compartilhar acomodações com empresas.
- Direito à exclusão/portabilidade dos dados do candidato.
- Rate limiting em login e denúncias; validação/sanitização de entradas.

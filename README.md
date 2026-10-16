# Conecta Inclusão

> Oportunidades que transformam realidades.

Plataforma web de empregos **inclusiva** para Pessoas com Deficiência (PcD), construída com foco em acessibilidade (WCAG 2.1 AA). Conecta candidatos, empresas e administradores em um ambiente totalmente acessível.

## Status da implementação

| Fase | Descrição | Status |
|------|-----------|--------|
| 0 | Fundação do projeto (React + TS + Vite, testes) | ✅ |
| 1 | Base de acessibilidade (temas, tour guiado, componentes, preferências) | ✅ |
| 2 | Autenticação e RBAC | ✅ |
| 3 | Área pública e busca de vagas | ✅ |
| 4 | Perfil Candidato | ✅ |
| 5 | Perfil Empresa | ✅ |
| 6 | Painel do Administrador (moderação) | ✅ |
| 7 | Qualidade, LGPD e lançamento | ✅ |

A especificação completa está em [`.kiro/specs/conecta-inclusao`](.kiro/specs/conecta-inclusao).

## Recursos de acessibilidade já disponíveis

- 🌗 **Tema claro/escuro** com persistência e respeito a `prefers-color-scheme`.
- 🔎 **Alto contraste** e **tamanho de fonte** ajustável (até 200%).
- 🎬 **Redução de movimento** automática, respeitando `prefers-reduced-motion`
  do sistema (sem alternância manual na interface).
- 🧭 **Navegação guiada** em **todas as telas**, por um ícone flutuante fixo
  (como o VLibras). Ao entrar em uma tela, a plataforma oferece o guia com as
  opções *Iniciar*, *Cancelar* e **"Não exibir novamente"** — sem bloquear a
  leitura. O guia continua sempre disponível no ícone.
- ⌨️ **Navegação por teclado** completa + link "Pular para o conteúdo".
- 📢 Região **aria-live** para anúncios dinâmicos.
- 🧩 Componentes acessíveis base (botão, modal com focus trap).

## Como rodar

```bash
npm install
npm run dev        # ambiente de desenvolvimento
npm run build      # build de produção
npm test           # testes unitários + acessibilidade (axe)

# Testes E2E (Playwright) — inclui navegação só por teclado
npx playwright install --with-deps   # 1ª vez
npm run test:e2e
```

### Instalação das dependências (frontend + API)

As dependências do **frontend** (raiz) e da **API** (`server/`) são instaladas
separadamente. Instale as duas de uma vez:

```bash
npm run setup   # = npm install  +  npm run api:install
```

> ℹ️ Se você rodar só `npm install`, as dependências da **API** não são
> instaladas e `npm run api` falha com `'tsx' não é reconhecido` /
> `tsx: not found`. Para evitar isso, os scripts `api`, `db:*` e `test:api`
> agora **instalam as dependências da API automaticamente** quando faltam.
> Ainda assim, prefira `npm run setup` logo após clonar.

### Com banco de dados (PostgreSQL)

**Linux/macOS (sem Docker):**

```bash
export CONECTA_PG_HOME="$PWD/.pgsql"                          # sandbox: HOME é só-leitura
./scripts/postgres.sh install && ./scripts/postgres.sh init  # sem Docker
cp server/.env.example server/.env                           # credenciais do banco + JWT_SECRET
npm run setup              # dependências do frontend + API
npm run db:reset           # schema + dados de demonstração (hashes bcrypt)
npm run api                # API em http://localhost:3001
cp .env.example .env.local # aponta o frontend para a API
npm run dev
npm run test:api           # 22 testes de integração contra o Postgres real
```

**Windows (PowerShell):** o `scripts/postgres.sh` é um script bash e **não roda
no Windows**. Use Docker para o banco:

```powershell
# 1. Banco via Docker (usuário/banco "conecta", sem senha — auth trust)
docker run --name conecta-pg -e POSTGRES_USER=conecta -e POSTGRES_DB=conecta `
  -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 -d postgres:15

# 2. Credenciais (os valores do exemplo já batem com o Docker acima)
Copy-Item server\.env.example server\.env

# 3. Dependências (frontend + API) e banco
npm run setup
npm run db:reset

# 4. API e, em outro terminal, o frontend
npm run api                      # http://localhost:3001
Copy-Item .env.example .env.local
npm run dev
```

> Sem Docker no Windows, instale o PostgreSQL nativamente e ajuste `server/.env`
> com o seu usuário/banco/senha reais (veja [`docs/banco-de-dados.md`](docs/banco-de-dados.md)).

A API é **real e completa**: senhas com **bcrypt**, sessão por **JWT** e
**RBAC** nas rotas de administração, com **transações** nas operações de várias
escritas (moderação, auditoria e notificações). Detalhes do modelo de dados, da
segurança, do seed e das contas de teste em
[`docs/banco-de-dados.md`](docs/banco-de-dados.md).

## Acesso e login

> **Login é obrigatório.** Toda a aplicação (home, busca de vagas, painéis) fica
> atrás de autenticação: ao abrir o app sem sessão, você é levado direto para a
> tela **Entrar** (`/entrar`). Após o login, a raiz (`/`) encaminha para o
> painel do seu papel (candidato → `/painel`, empresa → `/empresa`, admin →
> `/admin`). Quem ainda não tem conta usa **Criar conta** (`/cadastro`).

### Dois modos de dados (importante para o login funcionar)

O frontend decide a origem dos dados por `VITE_API_URL` (`src/api/client.ts`):

- **Com a API/PostgreSQL** (recomendado): defina `VITE_API_URL` em `.env.local`
  **e deixe a API rodando** (`npm run api`). O login usa as contas do banco
  (seed) — veja a tabela em [`docs/banco-de-dados.md`](docs/banco-de-dados.md).
- **Offline (localStorage)**: sem `VITE_API_URL`, o app roda sem backend. Nesse
  modo **só a conta de administrador** semeada localmente existe
  (`admin@conectainclusao.org` / `Admin@123`); as demais contas de demonstração
  vivem apenas no banco.

> ⚠️ Se você definir `VITE_API_URL` mas **a API não estiver no ar**, o login
> falha com **"Não foi possível conectar ao servidor…"** (não é senha errada).
> Suba a API (`npm run api`) ou remova o `.env.local` para usar o modo offline.

### Contas de demonstração (modo com banco)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@conectainclusao.org` | `Admin@123` |
| Candidata | `ana.souza@exemplo.com` | `Senha@123` |
| Empresa | `rh@techinclui.com.br` | `Senha@123` |

## Busca de vagas (Fase 3)

- 🔍 Busca por **palavra-chave, localização, modalidade, nível, área** e
  **recursos de acessibilidade** (requer login).
- 📣 Quantidade de resultados anunciada em região **`aria-live`**.
- 🔗 Filtros refletidos na **URL** (busca compartilhável e navegação de retorno).
- 🏷️ Página de detalhe com **selos de acessibilidade** da vaga.
- 🔒 Acesso autenticado: todo o app exige login (a candidatura confirma o
  consentimento de acomodações no envio — P2.3).
- ✅ Busca expõe somente vagas **aprovadas** (`APPROVED`), espelhando a regra de
  moderação do backend (P2.2 / M1).
- 🧭 **Navegação guiada** dedicada ao fluxo de busca de vagas.

> O serviço de vagas (`src/jobs/jobService.ts`) é um mock que persiste em
> `localStorage`, com um catálogo-semente de vagas. Sua interface foi desenhada
> para ser trocada por um cliente HTTP real (`GET /jobs`, `GET /jobs/:id`) sem
> alterar os componentes.

## Perfil do candidato (Fase 4)

- 🧑‍💼 **Perfil profissional** (experiência, formação, habilidades, pretensão).
- 🔐 **Informações de acessibilidade opcionais e sigilosas** (tipo de deficiência
  e acomodações) — criptografadas em repouso e compartilhadas com empresas
  **apenas mediante consentimento** no momento da candidatura (LGPD / NF2).
- 📄 **Upload de currículo** em formatos acessíveis (PDF, DOC, DOCX).
- 👁️ **Controle de visibilidade** do perfil (público, restrito ou privado).
- 📨 **Candidatura** com confirmação e feedback acessível; painel **"Minhas
  candidaturas"** com status e progresso (enviada → análise → entrevista →
  finalizada).
- ⭐ **Favoritos** e **alertas** de novas vagas por palavra-chave/área.
- 🚩 **Denúncia** de vagas, encaminhada à fila de moderação.
- 🧭 **Navegação guiada** do preenchimento de perfil.

## Perfil da empresa (Fase 5)

- 🏢 **Perfil institucional** (nome, CNPJ, setor, descrição, site) com
  **status de verificação** — a empresa nasce "pendente de verificação" até a
  aprovação do administrador (Fase 6).
- ♿ Destaque dos **recursos de acessibilidade** oferecidos no ambiente de
  trabalho.
- 📋 **CRUD de vagas**: criar, editar, pausar, encerrar, duplicar e remover.
  Toda vaga vai para **moderação** (status `PENDING`) e só fica pública após
  aprovação; editar uma vaga publicada a devolve à moderação.
- ✍️ **Assistente de descrição inclusiva**: verifica termos capacitistas e
  sugere alternativas, com dicas de redação.
- 📥 **Gestão de candidaturas por vaga**: atualização de status com
  **notificação ao candidato**, respeitando o consentimento de acomodações
  (dados sensíveis só aparecem se o candidato autorizou — NF2).
- 🧭 **Navegação guiada** da publicação de vaga.

## Painel do administrador (Fase 6)

- 🗂️ **Fila de moderação**: vagas pendentes e empresas a verificar.
- ✅ **Aprovar / rejeitar / solicitar ajustes** vagas com justificativa; o autor
  é notificado e a vaga só fica pública após aprovação.
- 🏢 **Verificação de empresas**.
- 🚩 **Gestão de denúncias** (arquivar).
- 🔒 **Suspensão / reativação de contas** — contas suspensas têm o login
  bloqueado.
- 📜 **Log de auditoria** imutável de todas as ações (quem, o quê, quando).
- 📊 **Métricas** da plataforma com **exportação CSV**.

## Qualidade, LGPD e lançamento (Fase 7)

- 🧪 **Testes E2E (Playwright)** por perfil, incluindo navegação **só por
  teclado** (`e2e/`).
- 🔐 **LGPD**: Central de Privacidade do candidato (`/painel/privacidade`) com
  **consentimento** versionado, **exportação** de dados em JSON (portabilidade)
  e **exclusão** da conta e de todos os dados.
- 🤟 **VLibras**: widget oficial de tradução para Libras integrado ao layout.
- ⚡ **Desempenho/PWA**: **code-splitting por rota** (carregamento sob demanda),
  manifest instalável e layout responsivo (320px → desktop).
- ♿ **Auditoria de acessibilidade** (axe) sem violações e checklists de
  validação com leitor de tela — ver [`docs/acessibilidade.md`](docs/acessibilidade.md).

## Organização do CSS (design por elementos)

Para facilitar a edição do design, os estilos reutilizáveis ficam em
`src/styles/elements/`, **um arquivo por elemento** (`dashboard`, `card`,
`badge`, `stat`, `callout`, `form-layout`, `text`), importados globalmente. Os
painéis de candidato, empresa e administrador **compõem** essas classes em vez
de repetir regras; cada CSS de página contém apenas o que é exclusivo dela.
Assim, para mudar a aparência de um elemento em todo o app, basta editar o
arquivo correspondente.

## Estrutura

```
server/              # API REST (Express + PostgreSQL)
├─ src/schema.sql    # schema do banco
├─ src/seed.sql      # dados de demonstração
├─ src/app.ts        # endpoints
└─ src/api.test.ts   # testes de integração (Postgres real)

src/
├─ api/              # cliente HTTP + chave da integração (apiEnabled)
├─ accessibility/    # preferências, tour guiado + ícone global, aria-live, VLibras
├─ auth/             # contexto de autenticação e RBAC
├─ jobs/             # domínio de vagas, busca pública + CRUD + moderação
├─ candidate/        # perfil, candidaturas, favoritos/alertas e denúncias
├─ company/          # perfil da empresa, verificação e linguagem inclusiva
├─ admin/            # serviços de moderação, auditoria e métricas
├─ privacy/          # fluxos LGPD (consentimento, exportação, exclusão)
├─ components/       # Layout, Button, Field, Modal, Avatar, controles de a11y
├─ pages/            # Home, autenticação, vagas e painéis
├─ styles/
│  ├─ tokens.css     # variáveis de design (cores, espaçamento, temas)
│  ├─ global.css     # reset, base e importações
│  └─ elements/      # 🎨 um arquivo CSS por elemento reutilizável
└─ test/             # testes (a11y, auth, vagas, candidato, empresa, admin, LGPD)
```

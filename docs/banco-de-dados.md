# Banco de dados (PostgreSQL) e API

A aplicação deixou de depender apenas de dados no navegador: agora há uma **API
REST (Express)** sobre **PostgreSQL**, com schema versionado e dados de
demonstração (seed).

## Como subir

### 1. PostgreSQL

Com Docker (recomendado):

```bash
docker run --name conecta-pg \
  -e POSTGRES_USER=conecta \
  -e POSTGRES_DB=conecta \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  -p 5432:5432 -d postgres:15
```

Sem Docker (instala o PostgreSQL 15 em um prefixo gravável):

```bash
./scripts/postgres.sh install   # só na primeira vez
./scripts/postgres.sh init      # cria o cluster e o banco "conecta"
./scripts/postgres.sh start
./scripts/postgres.sh status
```

### 2. Credenciais do banco (`server/.env`)

Copie o exemplo e preencha com os dados da sua instância:

```bash
cp server/.env.example server/.env
```

```ini
# server/.env  (ignorado pelo Git — nunca comite senhas reais)
# Estes valores batem com o banco criado tanto pelo Docker quanto pelo
# scripts/postgres.sh: usuário/banco "conecta" com auth "trust" (SEM senha).
PGHOST=localhost
PGPORT=5432
PGDATABASE=conecta
PGUSER=conecta
PGPASSWORD=
```

> ⚠️ **Importante:** o usuário, o banco e a senha precisam bater com a instância
> que você subiu. Os dois caminhos sugeridos aqui (Docker e `scripts/postgres.sh`)
> criam o usuário/banco **`conecta`** com autenticação **`trust`** (sem senha),
> então deixe `PGPASSWORD` **vazio**. Se o seu PostgreSQL usar outro
> usuário/banco/senha (ex.: a instalação padrão `postgres`/`postgres`), ajuste
> estes valores de acordo. Uma divergência aqui causa erros de conexão como
> `ECONNREFUSED`, `password authentication failed` ou `database "conecta" does
> not exist`.
>
> Prefira as variáveis separadas quando a senha tiver caracteres especiais
> (ex.: `@`): a aplicação faz o *percent-encoding* automaticamente. Se preferir,
> use `DATABASE_URL` (tem precedência) — mas aí a senha precisa ser codificada
> na própria URL (`@` → `%40`).

### Conectando pelo DBeaver

Depois de subir o PostgreSQL (Docker ou `scripts/postgres.sh`), crie uma
conexão **PostgreSQL** no DBeaver com **exatamente os mesmos valores** do
`server/.env`:

| Campo | Valor |
|-------|-------|
| Host | `localhost` (ou `127.0.0.1`) |
| Port | `5432` |
| Database | `conecta` |
| Username | `conecta` |
| Password | *(deixe em branco)* |

Como a autenticação é `trust`, a senha fica **vazia**. Marque **"Show all
databases"** se quiser enxergar o `postgres` além do `conecta`. Clique em **Test
Connection** — se aparecer "Connected", está tudo certo.

> Dica: se o DBeaver reclamar que a senha é obrigatória, em
> *Edit Connection → Connection settings* desmarque qualquer exigência de senha
> e salve com o campo vazio. Para a instalação sem Docker, confirme que o
> servidor está de pé com `./scripts/postgres.sh status` (deve dizer
> `accepting connections`).

#### O banco não aparece / não conecta no DBeaver?

1. **Servidor no ar?** `./scripts/postgres.sh status` deve responder
   `127.0.0.1:5432 - accepting connections`. Se não, rode `start` (ou `init` na
   primeira vez). No sandbox, exporte `CONECTA_PG_HOME="$PWD/.pgsql"` antes.
2. **Banco `conecta` existe?** `./scripts/postgres.sh psql -l` deve listar
   `conecta`. (O script agora espera o servidor ficar pronto antes de criar o
   banco, evitando o antigo erro `database "conecta" does not exist`.)
3. **Credenciais batem?** Host/porta/usuário/banco do DBeaver precisam ser
   idênticos aos do `server/.env`.
4. **Rodando em container/remoto?** Se o PostgreSQL está em um ambiente remoto
   (ex.: sandbox na nuvem), o DBeaver da sua máquina **não** alcança
   `localhost:5432` do servidor remoto — rode o banco localmente ou crie um
   túnel SSH até a porta 5432.

### 3. Schema + seed

```bash
npm run api:install   # dependências da API
npm run db:reset      # recria o schema e injeta o seed
```

### 4. API e frontend

```bash
npm run api           # http://localhost:3001
cp .env.example .env.local   # define VITE_API_URL (frontend -> API)
npm run dev           # http://localhost:5173
```

> Sem `VITE_API_URL`, o frontend continua funcionando com armazenamento local
> (demonstração offline). Com a variável definida, todos os dados vêm do
> PostgreSQL. Essa escolha fica em `src/api/client.ts` (`apiEnabled()`), e os
> serviços de domínio decidem a origem — nenhum componente de UI muda.

## Modelo de dados

`server/src/schema.sql` cria, com tipos enumerados e índices:

| Tabela | Conteúdo |
|--------|----------|
| `users` | contas (candidato, empresa, admin), status ativo/suspenso |
| `candidate_profiles` | perfil profissional + **bloco sensível cifrado** |
| `companies` | dados institucionais e status de verificação |
| `jobs` | vagas e seu ciclo de vida (`DRAFT`→`PENDING`→`APPROVED`…) |
| `applications` | candidaturas, status e acomodações compartilhadas |
| `favorites`, `job_alerts` | vagas salvas e alertas |
| `reports` | denúncias encaminhadas à moderação |
| `moderation_actions` | **log de auditoria** (quem, o quê, quando) |
| `notifications` | avisos a candidatos e empresas |
| `consents` | consentimento LGPD versionado |

### LGPD / NF2 no banco

- O tipo de deficiência e as acomodações ficam em
  `candidate_profiles.sensitive_enc`, **cifrados pela aplicação** — o banco
  nunca armazena esse conteúdo em claro, e a API devolve o bloco ainda cifrado.
- `applications.shared_accommodations` é `NULL` quando o candidato **não**
  autorizou o compartilhamento; a empresa só vê o que foi consentido.
- A exclusão do titular (`DELETE /privacy/:userId`) remove tudo em cascata
  (`ON DELETE CASCADE`).

## Dados de demonstração (seed)

`server/src/seed.sql` injeta:

- **1 administrador**
- **5 empresas** — 3 verificadas, 1 pendente, 1 com verificação recusada
- **5 candidatos** — com perfis preenchidos; 1 conta **suspensa** (para
  exercitar o bloqueio de login)
- **10 vagas** — 6 `APPROVED` (visíveis na busca pública), 2 `PENDING` (fila de
  moderação), 1 `DRAFT` e 1 `CLOSED`
- **8 candidaturas** cobrindo **todos os estados**: 2 `SENT`, 2 `REVIEW`,
  2 `INTERVIEW`, 2 `FINISHED` — parte com acomodações compartilhadas e parte sem
- **5 favoritos**, **5 alertas**, **5 denúncias**, **5 ações de auditoria**,
  **5 notificações** e **4 consentimentos**

### Contas para testar

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@conectainclusao.org` | `Admin@123` |
| Candidata | `ana.souza@exemplo.com` | `Senha@123` |
| Candidato | `bruno.carvalho@exemplo.com` | `Senha@123` |
| Empresa | `rh@techinclui.com.br` | `Senha@123` |
| Suspensa | `elisa.prado@exemplo.com` | `Senha@123` (login bloqueado) |

## Endpoints principais

```
POST   /auth/register           POST   /auth/login
GET    /jobs                    GET    /jobs/:id            GET /jobs/areas
GET    /companies/:id/jobs      POST   /jobs                PATCH /jobs/:id
PATCH  /jobs/:id/status
GET    /candidates/:id/applications      GET  /jobs/:id/applications
POST   /applications            PATCH  /applications/:id/status
GET    /companies/:id           PUT    /companies/:id
GET    /candidates/:id/profile  PUT    /candidates/:id/profile
POST   /reports                 GET    /reports             PATCH /reports/:id/status
GET    /admin/moderation/queue  PATCH  /admin/jobs/:id/review
PATCH  /admin/companies/:id/verify      GET   /admin/users
PATCH  /admin/users/:id/status  GET    /admin/audit         GET /admin/metrics
GET    /privacy/:id/export      DELETE /privacy/:id         PUT /privacy/:id/consent
```

## Segurança (autenticação e autorização)

A API usa segurança real (ver `server/src/auth.ts`):

- **Senhas com bcrypt** (hash + salt). `verifyPassword` ainda aceita o formato
  legado `hashed:base64` para migração suave, mas contas novas e o seed usam
  bcrypt.
- **Sessão por JWT** (HS256) assinado com `JWT_SECRET`. O token é devolvido no
  login/registro e enviado pelo frontend no header `Authorization: Bearer`.
- **RBAC por middleware**: as rotas `/admin/*` exigem o papel `ADMIN`
  (`requireRole("ADMIN")`); sem token → `401`, papel errado → `403`.

### Integridade transacional

Operações com **várias escritas** rodam em **transação** (`withTransaction` em
`server/src/db.ts`): moderar uma vaga (status + auditoria + notificação),
atualizar candidatura (status + notificação), verificar empresa e
suspender/reativar conta (status + auditoria) são **atômicas** — ou tudo
confirma, ou tudo reverte.

## Testes

```bash
npm run test:api   # 22 testes de integração contra o PostgreSQL real
```

A suíte recria o schema, injeta o seed e valida: busca pública só com vagas
aprovadas, filtros, bloqueio de conta suspensa, candidatura duplicada,
consentimento de acomodações, aprovação com auditoria, verificação de empresa,
exportação e exclusão LGPD, além de **JWT + RBAC** (401 sem token, 403 com papel
errado, 200 como admin).

## Nota para o sandbox de desenvolvimento

O `HOME` do sandbox é somente-leitura; aponte o prefixo do PostgreSQL para um
diretório gravável do projeto antes de instalar/iniciar:

```bash
export CONECTA_PG_HOME="$PWD/.pgsql"
./scripts/postgres.sh install && ./scripts/postgres.sh init && ./scripts/postgres.sh start
```

## Pendências antes de produção

- Rotação de chave do `JWT_SECRET` e refresh tokens.
- Trocar a cifra simbólica do bloco sensível por criptografia autenticada
  gerenciada por KMS, com log de acesso a dados sensíveis (NF8).

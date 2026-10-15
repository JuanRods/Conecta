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

### Com banco de dados (PostgreSQL)

```bash
export CONECTA_PG_HOME="$PWD/.pgsql"                          # sandbox: HOME é só-leitura
./scripts/postgres.sh install && ./scripts/postgres.sh init  # sem Docker
cp server/.env.example server/.env                           # credenciais do banco + JWT_SECRET
npm run api:install        # dependências da API
npm run db:reset           # schema + dados de demonstração (hashes bcrypt)
npm run api                # API em http://localhost:3001
cp .env.example .env.local # aponta o frontend para a API
npm run dev
npm run test:api           # 22 testes de integração contra o Postgres real
```

A API é **real e completa**: senhas com **bcrypt**, sessão por **JWT** e
**RBAC** nas rotas de administração, com **transações** nas operações de várias
escritas (moderação, auditoria e notificações). Detalhes do modelo de dados, da
segurança, do seed e das contas de teste em
[`docs/banco-de-dados.md`](docs/banco-de-dados.md).

## Busca pública de vagas (Fase 3)

- 🔍 Busca por **palavra-chave, localização, modalidade, nível, área** e
  **recursos de acessibilidade** — sem necessidade de conta.
- 📣 Quantidade de resultados anunciada em região **`aria-live`**.
- 🔗 Filtros refletidos na **URL** (busca compartilhável e navegação de retorno).
- 🏷️ Página de detalhe com **selos de acessibilidade** da vaga.
- 🔒 Login solicitado **apenas no momento da candidatura** (P2.3).
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

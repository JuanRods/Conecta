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
| 4 | Perfil Candidato | ⏳ |
| 5 | Perfil Empresa | ⏳ |
| 6 | Painel do Administrador (moderação) | ⏳ |
| 7 | Qualidade, LGPD e lançamento | ⏳ |

A especificação completa está em [`.kiro/specs/conecta-inclusao`](.kiro/specs/conecta-inclusao).

## Recursos de acessibilidade já disponíveis

- 🌗 **Tema claro/escuro** com persistência e respeito a `prefers-color-scheme`.
- 🔎 **Alto contraste** e **tamanho de fonte** ajustável (até 200%).
- 🎬 **Redução de movimento** (`prefers-reduced-motion` + opção manual).
- 🧭 **Navegação guiada** passo a passo, operável por teclado e leitor de tela.
- ⌨️ **Navegação por teclado** completa + link "Pular para o conteúdo".
- 📢 Região **aria-live** para anúncios dinâmicos.
- 🧩 Componentes acessíveis base (botão, modal com focus trap).

## Como rodar

```bash
npm install
npm run dev      # ambiente de desenvolvimento
npm run build    # build de produção
npm test         # testes unitários + acessibilidade (axe)
```

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

## Estrutura

```
src/
├─ accessibility/   # contexto de preferências, tour guiado, aria-live, focus trap
├─ auth/            # contexto de autenticação, RBAC, serviço mock (Fase 2)
├─ jobs/            # domínio de vagas, serviço de busca, selos de acessibilidade
├─ components/      # Layout, Button, Field, Modal, Logo, controles de a11y
├─ pages/           # Home, autenticação, busca e detalhe de vagas
├─ styles/          # tokens de design e CSS global (temas)
└─ test/            # setup e testes (acessibilidade, auth, vagas)
```

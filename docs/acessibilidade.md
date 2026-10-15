# Qualidade e Acessibilidade — Conecta Inclusão (Fase 7)

Este documento reúne os artefatos de qualidade da Fase 7: auditoria de
acessibilidade (NF1), checklist de validação com leitor de tela (NF5),
verificação de contraste nos dois temas (A4) e os fluxos de LGPD (NF2).

## 1. Auditoria automatizada (axe) — 7.6 / NF1

A auditoria axe roda nos testes unitários (`jest-axe`). Páginas/telas cobertas
sem violações críticas:

- Layout global (cabeçalho, navegação, rodapé, skip link).
- Cadastro e login.
- Busca pública de vagas e detalhe da vaga.
- Perfil do candidato.
- Perfil da empresa.
- Fila de moderação (admin).

Como rodar:

```bash
npm test          # inclui as asserções axe (toHaveNoViolations)
```

Resultado atual: **sem violações** nas telas auditadas.

## 2. Testes E2E e navegação por teclado — 7.1 / A2 / NF5

Suíte Playwright em `e2e/`, cobrindo visitante, candidato e navegação
**somente por teclado** (skip link, alternância de tema).

```bash
npx playwright install --with-deps   # 1ª vez
npm run test:e2e
```

Cenários:

- `keyboard-navigation.spec.ts` — skip link + tema via teclado (A2).
- `public-search.spec.ts` — busca pública e exigência de login só na
  candidatura (P2/P2.3).
- `candidate-journey.spec.ts` — cadastro → candidatura → "Minhas candidaturas".

## 3. Checklist de validação com leitor de tela — 7.2 / A3 / NF5

Validação manual recomendada com **NVDA** (Windows), **VoiceOver** (macOS/iOS)
e **TalkBack** (Android). Para cada fluxo abaixo, confirme:

- [ ] A ordem de leitura segue a ordem visual e lógica.
- [ ] Todos os campos têm rótulo lido corretamente; obrigatórios anunciados.
- [ ] Erros de formulário são anunciados e recebem foco (resumo no topo).
- [ ] Mudanças dinâmicas (resultados de busca, confirmações) são anunciadas via
      região `aria-live`.
- [ ] Modais prendem o foco; `Esc` fecha; o foco retorna ao gatilho.
- [ ] Imagens decorativas têm `aria-hidden`; selos têm texto equivalente.
- [ ] Marcos (`header/nav/main/footer`) são navegáveis por atalhos do leitor.

Fluxos a validar: cadastro/login · busca e detalhe de vaga · perfil do
candidato · candidatura (com consentimento) · publicação de vaga (empresa) ·
fila de moderação (admin) · central de privacidade (LGPD).

## 4. Contraste nos dois temas — 7.3 / A4

Os tokens de cor (`src/styles/tokens.css`) foram escolhidos para atender ao
**WCAG 2.1 AA** (contraste mínimo 4,5:1 para texto normal). Verificar após
qualquer mudança de paleta, nos temas **claro** e **escuro**, e no modo de
**alto contraste**:

- [ ] Texto sobre `--color-bg` e sobre `--color-surface`.
- [ ] Texto de botões (`--color-primary-fg` sobre `--color-primary`).
- [ ] Estados de foco (`--color-focus`) visíveis em ambos os temas.
- [ ] Selos/badges (success/warning/error) legíveis.

Ferramentas sugeridas: axe DevTools, Lighthouse, WebAIM Contrast Checker.

## 5. VLibras — 7.3 / NF6

O widget oficial **VLibras** é carregado em `src/accessibility/VLibras.tsx` e
montado no `Layout`. Caso o script não carregue (ex.: offline), a aplicação
continua acessível sem ele.

## 6. LGPD — 7.4 / NF2

Central de Privacidade do candidato (`/painel/privacidade`):

- **Consentimento** versionado (registrar/revogar).
- **Portabilidade**: exportação de todos os dados em JSON.
- **Direito à exclusão**: remoção da conta e de todos os dados associados
  (perfil, candidaturas, favoritos, alertas, notificações, denúncias).

Dados sensíveis (tipo de deficiência e acomodações) são criptografados em
repouso (simulado no mock) e só compartilhados com empresas mediante
consentimento explícito por candidatura.

## 7. Desempenho, PWA e responsividade — 7.5 / NF3 / NF4

- **Code-splitting por rota**: painéis e páginas de vagas carregam sob demanda
  (`React.lazy`), reduzindo o bundle inicial.
- **PWA**: `public/manifest.webmanifest` + ícone e meta tags (instalável).
- **Responsividade**: layouts em grade fluida (`minmax`/`auto-fit`) funcionam de
  320px a desktop, sem rolagem horizontal.
- Metas de Core Web Vitals ("bom") a confirmar com Lighthouse em produção.

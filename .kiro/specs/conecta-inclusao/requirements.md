# Conecta Inclusão — Documento de Requisitos

> **Oportunidades que transformam realidades**
>
> Plataforma web de empregos voltada à inclusão de **Pessoas com Deficiência (PcD)**, conectando candidatos e empresas em um ambiente totalmente acessível.

## 1. Visão Geral

O **Conecta Inclusão** é um portal de vagas inclusivo com três perfis de uso distintos:

1. **Candidato (PcD)** — pessoa com deficiência que busca oportunidades de emprego.
2. **Empresa** — organizações que publicam vagas e procuram talentos.
3. **Administrador** — equipe que modera conteúdos (vagas, perfis, denúncias) para garantir qualidade e conformidade.

A acessibilidade é o pilar central: o produto deve atender à **WCAG 2.1 nível AA** e às diretrizes de acessibilidade da legislação brasileira (Lei Brasileira de Inclusão — LBI nº 13.146/2015 e e-MAG).

### 1.1 Glossário

| Termo | Definição |
|-------|-----------|
| **PcD** | Pessoa com Deficiência |
| **Candidato** | Usuário PcD que procura emprego |
| **Recrutador** | Usuário vinculado a uma Empresa |
| **Vaga** | Oferta de trabalho publicada por uma Empresa |
| **Candidatura** | Ato de um Candidato se aplicar a uma Vaga |
| **Moderação** | Processo de aprovar/rejeitar/remover conteúdo |
| **WCAG** | Web Content Accessibility Guidelines |
| **e-MAG** | Modelo de Acessibilidade em Governo Eletrônico (Brasil) |
| **Navegação guiada** | Modo passo a passo que orienta o usuário por fluxos complexos |

---

## 2. Requisitos de Acessibilidade (Transversais)

Estes requisitos se aplicam a **todas** as telas e perfis.

### Requisito A1 — Conformidade WCAG 2.1 AA

**História:** Como pessoa com deficiência, quero que todo o site siga padrões reconhecidos de acessibilidade, para que eu consiga usá-lo com qualquer tecnologia assistiva.

**Critérios de Aceitação:**
1. QUANDO qualquer página for carregada, ENTÃO o sistema DEVE cumprir os critérios WCAG 2.1 nível AA.
2. QUANDO um elemento interativo receber foco, ENTÃO o sistema DEVE exibir um indicador de foco visível com contraste mínimo de 3:1.
3. O sistema DEVE garantir contraste de texto de pelo menos 4,5:1 (texto normal) e 3:1 (texto grande).
4. QUANDO imagens informativas forem exibidas, ENTÃO o sistema DEVE fornecer texto alternativo (`alt`) descritivo; imagens decorativas DEVEM ter `alt` vazio.
5. O sistema DEVE usar HTML semântico e marcos ARIA (`header`, `nav`, `main`, `footer`, `landmarks`).

### Requisito A2 — Navegação por Teclado

**História:** Como usuário que não utiliza mouse, quero navegar por todo o site apenas com o teclado, para acessar todas as funcionalidades.

**Critérios de Aceitação:**
1. QUANDO o usuário usar Tab/Shift+Tab, ENTÃO o sistema DEVE percorrer todos os elementos interativos em ordem lógica.
2. O sistema DEVE fornecer um link "Pular para o conteúdo principal" como primeiro elemento focável.
3. QUANDO um modal/menu abrir, ENTÃO o sistema DEVE prender o foco (focus trap) e devolvê-lo ao elemento de origem ao fechar.
4. O sistema NÃO DEVE conter armadilhas de teclado (keyboard traps).

### Requisito A3 — Leitores de Tela

**História:** Como usuário cego, quero que o leitor de tela anuncie corretamente os elementos e mudanças de estado.

**Critérios de Aceitação:**
1. QUANDO conteúdo dinâmico mudar (ex.: resultados de busca), ENTÃO o sistema DEVE anunciar via `aria-live`.
2. Todos os campos de formulário DEVEM ter rótulos (`label`) associados programaticamente.
3. QUANDO ocorrer erro de validação, ENTÃO o sistema DEVE associar a mensagem ao campo (`aria-describedby`) e mover o foco para o primeiro erro.
4. O sistema DEVE definir o idioma da página (`lang="pt-BR"`).

### Requisito A4 — Tema Claro e Escuro

**História:** Como usuário com sensibilidade visual, quero alternar entre modo claro e escuro, para reduzir o cansaço visual.

**Critérios de Aceitação:**
1. O sistema DEVE oferecer alternância entre tema claro e escuro em local visível e acessível por teclado.
2. QUANDO o usuário escolher um tema, ENTÃO o sistema DEVE persistir a preferência (ex.: `localStorage`) entre sessões.
3. QUANDO o usuário não tiver escolhido tema, ENTÃO o sistema DEVE respeitar a preferência do SO (`prefers-color-scheme`).
4. Ambos os temas DEVEM manter o contraste mínimo exigido pela WCAG AA.

### Requisito A5 — Navegação Guiada

**História:** Como usuário que precisa de orientação, quero um modo de navegação guiada que me conduza passo a passo pelos fluxos principais, para não me perder.

**Critérios de Aceitação:**
1. O sistema DEVE oferecer um modo de navegação guiada acionável a partir de qualquer tela principal.
2. QUANDO a navegação guiada estiver ativa, ENTÃO o sistema DEVE destacar o próximo passo e descrever a ação esperada em texto claro.
3. A navegação guiada DEVE ser totalmente operável por teclado e anunciada por leitor de tela.
4. O usuário DEVE poder avançar, retroceder, pular e encerrar o guia a qualquer momento.
5. O sistema DEVE cobrir, no mínimo, os fluxos: cadastro, busca de vagas, candidatura (candidato) e publicação de vaga (empresa).

### Requisito A6 — Preferências de Apresentação

**História:** Como usuário com baixa visão ou dislexia, quero ajustar o tamanho da fonte e o espaçamento, para ler com conforto.

**Critérios de Aceitação:**
1. O sistema DEVE permitir aumentar/diminuir o tamanho da fonte sem quebra de layout até 200% de zoom.
2. O sistema DEVE respeitar `prefers-reduced-motion`, reduzindo ou removendo animações quando solicitado.
3. O sistema DEVE oferecer opção de alto contraste adicional (opcional ao tema escuro).

---

## 3. Requisitos — Área Pública / Autenticação

### Requisito P1 — Cadastro e Login

**História:** Como visitante, quero me cadastrar e entrar como candidato ou empresa, para acessar as funcionalidades do meu perfil.

**Critérios de Aceitação:**
1. QUANDO um visitante iniciar o cadastro, ENTÃO o sistema DEVE permitir escolher o tipo de conta (Candidato ou Empresa).
2. O sistema DEVE validar e-mail e exigir senha forte, exibindo requisitos de forma acessível.
3. QUANDO as credenciais forem válidas, ENTÃO o sistema DEVE autenticar e redirecionar ao painel correspondente ao perfil.
4. O sistema DEVE oferecer recuperação de senha por e-mail.
5. O sistema DEVE suportar perfis de acesso distintos (candidato, empresa, administrador) com autorização baseada em papel (RBAC).

### Requisito P2 — Página Inicial e Busca Pública

**História:** Como visitante, quero buscar vagas sem precisar de conta, para avaliar as oportunidades disponíveis.

**Critérios de Aceitação:**
1. O sistema DEVE exibir, na página inicial, busca por palavra-chave, localização e tipo de deficiência atendida/recursos de acessibilidade da vaga.
2. QUANDO o visitante pesquisar, ENTÃO o sistema DEVE listar vagas aprovadas com filtros (modalidade, área, nível, inclusividade).
3. QUANDO o visitante abrir uma vaga, ENTÃO o sistema DEVE exigir login apenas no momento da candidatura.

---

## 4. Requisitos — Perfil Candidato (PcD)

### Requisito C1 — Perfil Profissional Acessível

**História:** Como candidato PcD, quero montar meu perfil incluindo recursos de acessibilidade que necessito, para que empresas me encontrem e me acomodem.

**Critérios de Aceitação:**
1. O sistema DEVE permitir cadastrar dados profissionais (experiência, formação, habilidades, pretensão).
2. O sistema DEVE permitir informar, de forma **opcional e sigilosa**, o tipo de deficiência e as acomodações necessárias (ex.: leitor de tela, libras, acesso físico).
3. O sistema DEVE permitir anexar currículo em formatos acessíveis (PDF com tags/`.docx`).
4. O candidato DEVE controlar a visibilidade do perfil (público, apenas para vagas candidatadas, privado).

### Requisito C2 — Busca e Candidatura a Vagas

**História:** Como candidato, quero buscar e me candidatar a vagas, acompanhando o andamento, para gerenciar minha procura por emprego.

**Critérios de Aceitação:**
1. O sistema DEVE permitir filtrar vagas por recursos de acessibilidade oferecidos pela empresa.
2. QUANDO o candidato se candidatar, ENTÃO o sistema DEVE registrar a candidatura e confirmar com feedback acessível.
3. O sistema DEVE exibir o status de cada candidatura (enviada, em análise, entrevista, finalizada).
4. O sistema DEVE permitir salvar vagas como favoritas e configurar alertas de novas vagas.

### Requisito C3 — Denúncia de Conteúdo

**História:** Como candidato, quero denunciar vagas ou empresas inadequadas, para manter a plataforma segura.

**Critérios de Aceitação:**
1. QUANDO o candidato visualizar uma vaga, ENTÃO o sistema DEVE oferecer opção de denunciar com motivo.
2. QUANDO uma denúncia for enviada, ENTÃO o sistema DEVE encaminhá-la à fila de moderação.

---

## 5. Requisitos — Perfil Empresa

### Requisito E1 — Perfil e Verificação da Empresa

**História:** Como empresa, quero criar e verificar meu perfil institucional, para transmitir confiança aos candidatos.

**Critérios de Aceitação:**
1. O sistema DEVE permitir cadastrar dados da empresa (CNPJ, descrição, setor, políticas de inclusão).
2. O sistema DEVE permitir destacar os recursos de acessibilidade oferecidos no ambiente de trabalho.
3. QUANDO a empresa se cadastrar, ENTÃO o sistema DEVE marcar o perfil como "pendente de verificação" até aprovação do administrador.

### Requisito E2 — Publicação e Gestão de Vagas

**História:** Como recrutador, quero publicar e gerenciar vagas inclusivas, para atrair candidatos PcD.

**Critérios de Aceitação:**
1. O sistema DEVE permitir criar vagas com campos de acessibilidade/acomodações oferecidas.
2. O sistema DEVE orientar a escrita de descrições inclusivas (dicas e verificação de linguagem).
3. QUANDO uma vaga for publicada, ENTÃO o sistema DEVE enviá-la à moderação antes de ficar visível ao público.
4. O sistema DEVE permitir editar, pausar, encerrar e duplicar vagas.

### Requisito E3 — Gestão de Candidaturas

**História:** Como recrutador, quero visualizar e gerenciar candidaturas recebidas, para conduzir o processo seletivo.

**Critérios de Aceitação:**
1. O sistema DEVE listar candidatos por vaga com os recursos de acessibilidade que solicitam.
2. O sistema DEVE permitir atualizar o status de cada candidatura e notificar o candidato.
3. O sistema NÃO DEVE expor dados sensíveis de deficiência sem consentimento explícito do candidato.

---

## 6. Requisitos — Perfil Administrador (Moderação)

### Requisito M1 — Painel de Moderação

**História:** Como administrador, quero moderar vagas, empresas e perfis, para garantir qualidade, segurança e conformidade legal.

**Critérios de Aceitação:**
1. O sistema DEVE exibir uma fila de itens pendentes (vagas novas, empresas a verificar, denúncias).
2. QUANDO o administrador revisar um item, ENTÃO o sistema DEVE permitir aprovar, rejeitar (com justificativa) ou solicitar ajustes.
3. QUANDO um item for rejeitado, ENTÃO o sistema DEVE notificar o autor com o motivo.
4. O sistema DEVE registrar um histórico de auditoria de todas as ações de moderação (quem, o quê, quando).

### Requisito M2 — Gestão de Usuários e Denúncias

**História:** Como administrador, quero tratar denúncias e gerenciar contas, para responder a abusos.

**Critérios de Aceitação:**
1. O sistema DEVE listar denúncias com contexto e permitir ação (arquivar, remover conteúdo, suspender conta).
2. O sistema DEVE permitir suspender/reativar contas de candidatos e empresas.
3. QUANDO uma conta for suspensa, ENTÃO o sistema DEVE impedir o login e informar o motivo.

### Requisito M3 — Métricas e Relatórios

**História:** Como administrador, quero visualizar métricas da plataforma, para acompanhar o impacto da inclusão.

**Critérios de Aceitação:**
1. O sistema DEVE exibir indicadores (vagas ativas, candidaturas, empresas verificadas, taxa de contratação PcD).
2. O sistema DEVE permitir exportar relatórios em formato acessível (CSV).

---

## 7. Requisitos Não Funcionais

| ID | Categoria | Requisito |
|----|-----------|-----------|
| NF1 | **Acessibilidade** | Conformidade WCAG 2.1 AA e e-MAG; auditoria automatizada (axe) sem violações críticas. |
| NF2 | **Segurança / LGPD** | Dados de deficiência são dados sensíveis: criptografia em repouso, consentimento explícito, direito à exclusão. |
| NF3 | **Desempenho** | Carregamento inicial < 3s em 3G; Core Web Vitals "bom". |
| NF4 | **Responsividade** | Layout funcional de 320px a desktop; sem rolagem horizontal. |
| NF5 | **Compatibilidade** | Chrome, Firefox, Safari, Edge (2 versões recentes) + leitores NVDA, JAWS, VoiceOver, TalkBack. |
| NF6 | **Internacionalização** | Interface em pt-BR; estrutura preparada para libras/VLibras. |
| NF7 | **Confiabilidade** | Disponibilidade alvo 99,5%; backups diários. |
| NF8 | **Auditoria** | Log de ações de moderação e acessos a dados sensíveis. |

---

## 8. Fora de Escopo (versão inicial)

- Aplicativo móvel nativo (o site será responsivo/PWA).
- Integração de pagamentos / planos pagos.
- Chat em tempo real entre candidato e empresa (previsto para fase futura).
- Testes psicométricos integrados.

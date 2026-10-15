import type { TourStep } from "./GuidedTour";

/**
 * REGISTRO CENTRAL DE NAVEGAÇÕES GUIADAS (A5).
 *
 * Cada tela da aplicação declara aqui seu roteiro. O ícone flutuante de
 * Navegação Guiada (`TourLauncher`) encontra o tour da rota atual, oferece
 * ao usuário ao entrar na tela (com opção de "não exibir novamente") e fica
 * sempre disponível para reiniciar o guia manualmente.
 *
 * Para adicionar um tour: inclua uma entrada com o padrão da rota e os passos.
 */

export interface TourDefinition {
  /** Identificador estável (usado para "concluído" e "não exibir novamente"). */
  id: string;
  /** Nome amigável da tela, usado no convite. */
  screen: string;
  /** Padrão de rota: segmentos iguais, ou `:param` para curinga. */
  path: string;
  steps: TourStep[];
}

export const TOURS: TourDefinition[] = [
  // ---------------- Área pública ----------------
  {
    id: "home",
    screen: "Página inicial",
    path: "/",
    steps: [
      {
        title: "Bem-vindo(a) ao Conecta Inclusão",
        description:
          "Esta navegação guiada mostra os principais recursos. Use Próximo e Anterior, ou pressione Esc para sair.",
      },
      {
        target: ".a11y-controls",
        title: "Personalize sua experiência",
        description:
          "Aqui você alterna entre tema claro e escuro, ativa alto contraste e muda o tamanho da fonte.",
      },
      {
        target: "#busca-vagas",
        title: "Encontre vagas inclusivas",
        description:
          "Busque vagas por palavra-chave, local e recursos de acessibilidade oferecidos.",
      },
      {
        target: "#cta-empresas",
        title: "É uma empresa?",
        description:
          "Empresas podem cadastrar vagas inclusivas e encontrar talentos.",
      },
    ],
  },
  {
    id: "busca-vagas",
    screen: "Busca de vagas",
    path: "/vagas",
    steps: [
      {
        target: "#form-busca",
        title: "Pesquise por palavra-chave e local",
        description:
          "Digite um cargo, tecnologia ou cidade. A busca ignora acentos e maiúsculas.",
      },
      {
        target: "#filtros-vaga",
        title: "Refine com os filtros",
        description:
          "Escolha modalidade, nível, área e os recursos de acessibilidade que você precisa.",
      },
      {
        target: "#filtro-recursos",
        title: "Recursos de acessibilidade",
        description:
          "Marque os recursos necessários. Mostramos apenas vagas que oferecem todos os selecionados.",
      },
    ],
  },
  {
    id: "detalhe-vaga",
    screen: "Detalhe da vaga",
    path: "/vagas/:id",
    steps: [
      {
        target: "#a11y-title",
        title: "Selos de acessibilidade",
        description:
          "Veja quais recursos de acessibilidade a empresa oferece nesta vaga.",
      },
      {
        target: ".job-detail__cta",
        title: "Candidatar-se, salvar ou denunciar",
        description:
          "O login é solicitado apenas neste momento. Você também pode salvar a vaga ou denunciá-la.",
      },
    ],
  },

  // ---------------- Autenticação ----------------
  {
    id: "cadastro",
    screen: "Criar conta",
    path: "/cadastro",
    steps: [
      {
        target: "#account-type-group",
        title: "Escolha o tipo de conta",
        description:
          'Selecione "Candidato" se você procura emprego, ou "Empresa" se quer publicar vagas.',
      },
      {
        target: "#register-password",
        title: "Crie uma senha forte",
        description:
          "Siga os requisitos listados abaixo do campo para proteger sua conta.",
      },
    ],
  },
  {
    id: "login",
    screen: "Entrar",
    path: "/entrar",
    steps: [
      {
        title: "Acesse sua conta",
        description:
          "Informe e-mail e senha. Se esqueceu a senha, use o link de recuperação.",
      },
    ],
  },

  // ---------------- Painel do candidato ----------------
  {
    id: "painel-candidato",
    screen: "Painel do candidato",
    path: "/painel",
    steps: [
      {
        target: ".dashboard__nav",
        title: "Navegue pelo seu painel",
        description:
          "Use estas abas para acessar seu perfil, candidaturas, favoritos e privacidade.",
      },
      {
        target: ".feed",
        title: "Vagas recomendadas",
        description:
          "No centro aparecem vagas que combinam com o seu perfil e sua atividade recente.",
      },
    ],
  },
  {
    id: "perfil-candidato",
    screen: "Meu perfil",
    path: "/painel/perfil",
    steps: [
      {
        target: "#perfil-profissional",
        title: "Dados profissionais",
        description:
          "Preencha experiência, formação e habilidades para empresas encontrarem você.",
      },
      {
        target: "#perfil-sensivel",
        title: "Informações opcionais e sigilosas",
        description:
          "Tipo de deficiência e acomodações são opcionais, criptografados e só compartilhados com seu consentimento.",
      },
      {
        target: "#perfil-curriculo",
        title: "Currículo acessível",
        description:
          "Anexe seu currículo em PDF ou Word. Prefira PDFs com marcação (tags).",
      },
      {
        target: "#perfil-visibilidade",
        title: "Controle de visibilidade",
        description:
          "Você decide quem vê seu perfil: público, restrito ou privado.",
      },
    ],
  },
  {
    id: "minhas-candidaturas",
    screen: "Minhas candidaturas",
    path: "/painel/candidaturas",
    steps: [
      {
        title: "Acompanhe seus processos",
        description:
          "Cada candidatura mostra o status atual: enviada, em análise, entrevista ou finalizada.",
      },
    ],
  },
  {
    id: "favoritos-alertas",
    screen: "Favoritos e alertas",
    path: "/painel/favoritos",
    steps: [
      {
        target: "#alert-title",
        title: "Alertas de novas vagas",
        description:
          "Crie alertas por palavra-chave ou área para ser avisado de vagas novas.",
      },
    ],
  },
  {
    id: "privacidade",
    screen: "Privacidade",
    path: "/painel/privacidade",
    steps: [
      {
        target: "#consent-title",
        title: "Seu consentimento",
        description:
          "Você pode conceder ou revogar o consentimento de tratamento dos seus dados.",
      },
      {
        target: "#export-title",
        title: "Portabilidade",
        description: "Baixe uma cópia completa dos seus dados em JSON.",
      },
      {
        target: "#delete-title",
        title: "Direito à exclusão",
        description:
          "Você pode excluir sua conta e todos os dados associados, de forma permanente.",
      },
    ],
  },

  // ---------------- Painel da empresa ----------------
  {
    id: "painel-empresa",
    screen: "Painel da empresa",
    path: "/empresa",
    steps: [
      {
        target: ".dashboard__nav",
        title: "Navegue pelo painel",
        description:
          "Acesse o perfil da empresa e a gestão das suas vagas por estas abas.",
      },
    ],
  },
  {
    id: "perfil-empresa",
    screen: "Perfil da empresa",
    path: "/empresa/perfil",
    steps: [
      {
        title: "Transmita confiança",
        description:
          "Complete os dados institucionais e as políticas de inclusão. A verificação é feita pela moderação.",
      },
    ],
  },
  {
    id: "minhas-vagas",
    screen: "Minhas vagas",
    path: "/empresa/vagas",
    steps: [
      {
        title: "Gerencie suas vagas",
        description:
          "Edite, pause, encerre ou duplique vagas e veja as candidaturas recebidas.",
      },
    ],
  },
  {
    id: "publicar-vaga",
    screen: "Nova vaga",
    path: "/empresa/vagas/nova",
    steps: [
      {
        target: "#job-title",
        title: "Dê um título claro",
        description:
          "Descreva o cargo de forma objetiva e inclusiva (ex.: Pessoa Desenvolvedora Front-end).",
      },
      {
        target: "#job-description",
        title: "Detalhe a vaga",
        description:
          "Explique responsabilidades e requisitos essenciais da função.",
      },
      {
        target: "#assist-title",
        title: "Assistente de linguagem inclusiva",
        description:
          "Verifique termos a evitar e siga as dicas para uma descrição acolhedora.",
      },
      {
        target: "#job-form-title",
        title: "Envio à moderação",
        description:
          "Ao salvar, a vaga vai para a moderação e fica pública somente após aprovação.",
      },
    ],
  },

  // ---------------- Painel do administrador ----------------
  {
    id: "painel-admin",
    screen: "Painel do administrador",
    path: "/admin",
    steps: [
      {
        target: ".dashboard__nav",
        title: "Áreas de moderação",
        description:
          "Acesse a fila de moderação, denúncias, contas, auditoria e métricas.",
      },
    ],
  },
  {
    id: "fila-moderacao",
    screen: "Fila de moderação",
    path: "/admin/moderacao",
    steps: [
      {
        target: "#mod-jobs-title",
        title: "Vagas aguardando aprovação",
        description:
          "Aprove, solicite ajustes ou rejeite com justificativa. O autor é notificado.",
      },
      {
        target: "#mod-companies-title",
        title: "Empresas a verificar",
        description:
          "Verifique empresas para que recebam o selo de confiança.",
      },
    ],
  },
  {
    id: "metricas",
    screen: "Métricas",
    path: "/admin/metricas",
    steps: [
      {
        title: "Indicadores da plataforma",
        description:
          "Acompanhe usuários, empresas, vagas e denúncias. Exporte tudo em CSV.",
      },
    ],
  },
];

/**
 * Encontra o tour correspondente a um caminho, tratando `:param` como curinga.
 * Prefere a correspondência mais específica (mais segmentos literais).
 */
export function findTourForPath(pathname: string): TourDefinition | null {
  const target = normalize(pathname);
  let best: { tour: TourDefinition; score: number } | null = null;

  for (const tour of TOURS) {
    const pattern = normalize(tour.path);
    if (pattern.length !== target.length) continue;

    let score = 0;
    let matches = true;
    for (let i = 0; i < pattern.length; i += 1) {
      if (pattern[i].startsWith(":")) continue; // curinga
      if (pattern[i] !== target[i]) {
        matches = false;
        break;
      }
      score += 1;
    }
    if (matches && (best === null || score > best.score)) {
      best = { tour, score };
    }
  }

  return best?.tour ?? null;
}

function normalize(path: string): string[] {
  return path.split("/").filter(Boolean);
}

import type { CreatePostInput, Post, PostComment } from "./types";
import { api, apiEnabled } from "../api/client";

/**
 * Serviço do Feed de Publicações.
 *
 * NOTA DE AMBIENTE: igual ao `jobService`, quando não há backend configurado
 * (`VITE_API_URL` ausente) esta implementação persiste em localStorage e simula
 * os endpoints (GET /posts, POST /posts, POST /posts/:id/like, …). A interface
 * pública foi desenhada para ser trocada por um cliente HTTP real sem alterar
 * os componentes de UI.
 */

const POSTS_KEY = "conecta.posts";

function makeId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `post-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Mantém o contrato assíncrono do serviço sem atraso artificial: no modo
 * offline (localStorage) as operações resolvem imediatamente, para que publicar
 * e curtir sejam instantâneos. Quando a API real está ativa, a latência é a da
 * rede/banco de verdade.
 */
function resolveNow<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// --- Seed: publicações iniciais para o feed ter conteúdo na demonstração ---

const SEED_POSTS: Post[] = [
  {
    id: "seed-post-1",
    authorId: "seed-techinclui",
    authorName: "TechInclui",
    authorRole: "COMPANY",
    authorHeadline: "Tecnologia acessível · São Paulo, SP",
    content:
      "Estamos com vagas abertas para pessoas desenvolvedoras front-end! " +
      "Nosso time trabalha com acessibilidade desde o design (WCAG 2.1 AA) e " +
      "oferece horário flexível e tecnologia assistiva. Bora construir uma web " +
      "para todas as pessoas? 💜",
    createdAt: "2026-10-18T13:00:00.000Z",
    likedBy: ["seed-ana", "seed-joao"],
    comments: [
      {
        id: "seed-c-1",
        authorId: "seed-ana",
        authorName: "Ana Souza",
        content: "Que oportunidade incrível! Acabei de me candidatar. 🙌",
        createdAt: "2026-10-18T14:10:00.000Z",
      },
    ],
  },
  {
    id: "seed-post-2",
    authorId: "seed-admin",
    authorName: "Equipe Conecta",
    authorRole: "ADMIN",
    authorHeadline: "Conecta Inclusão",
    content:
      "Dica da semana: ao se candidatar, você pode pedir acomodações para o " +
      "processo seletivo (intérprete de Libras, tempo adicional, material em " +
      "alto contraste). Informar uma deficiência é opcional e sigiloso. Seus " +
      "direitos vêm primeiro. ♿",
    createdAt: "2026-10-17T09:30:00.000Z",
    likedBy: ["seed-joao"],
    comments: [],
  },
  {
    id: "seed-post-3",
    authorId: "seed-joao",
    authorName: "João Pereira",
    authorRole: "CANDIDATE",
    authorHeadline: "Analista de dados · Procurando novas oportunidades",
    content:
      "Depois de 3 meses buscando, consegui minha primeira vaga afirmativa " +
      "para PcD por aqui! Obrigado à comunidade pelas dicas de currículo " +
      "acessível. Não desistam — a vaga certa existe. 🚀",
    createdAt: "2026-10-16T18:45:00.000Z",
    likedBy: ["seed-ana", "seed-techinclui"],
    comments: [
      {
        id: "seed-c-2",
        authorId: "seed-techinclui",
        authorName: "TechInclui",
        content: "Parabéns, João! Sucesso nessa nova etapa. 👏",
        createdAt: "2026-10-16T19:02:00.000Z",
      },
    ],
  },
];

function loadPosts(): Post[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as Post[];
  } catch {
    /* cai no seed abaixo */
  }
  localStorage.setItem(POSTS_KEY, JSON.stringify(SEED_POSTS));
  return SEED_POSTS;
}

function savePosts(posts: Post[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function sortByNewest(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const postService = {
  /** Lista as publicações do feed, mais recentes primeiro. */
  async list(): Promise<Post[]> {
    if (apiEnabled()) return api.get<Post[]>("/posts");
    return resolveNow(sortByNewest(loadPosts()));
  },

  /** Cria uma nova publicação e a devolve já no topo do feed. */
  async create(input: CreatePostInput): Promise<Post> {
    if (apiEnabled()) return api.post<Post>("/posts", input);
    const all = loadPosts();
    const post: Post = {
      id: makeId(),
      authorId: input.authorId,
      authorName: input.authorName,
      authorRole: input.authorRole,
      authorHeadline: input.authorHeadline,
      content: input.content.trim(),
      createdAt: new Date().toISOString(),
      likedBy: [],
      comments: [],
    };
    all.push(post);
    savePosts(all);
    return resolveNow(post);
  },

  /** Alterna a curtida de uma publicação para um usuário. */
  async toggleLike(postId: string, userId: string): Promise<Post> {
    if (apiEnabled()) {
      return api.post<Post>(`/posts/${postId}/like`, { userId });
    }
    const all = loadPosts();
    const idx = all.findIndex((p) => p.id === postId);
    if (idx === -1) throw new Error("Publicação não encontrada.");
    const liked = all[idx].likedBy.includes(userId);
    all[idx] = {
      ...all[idx],
      likedBy: liked
        ? all[idx].likedBy.filter((id) => id !== userId)
        : [...all[idx].likedBy, userId],
    };
    savePosts(all);
    return resolveNow(all[idx]);
  },

  /** Adiciona um comentário a uma publicação. */
  async addComment(
    postId: string,
    comment: Omit<PostComment, "id" | "createdAt">,
  ): Promise<Post> {
    if (apiEnabled()) {
      return api.post<Post>(`/posts/${postId}/comments`, comment);
    }
    const all = loadPosts();
    const idx = all.findIndex((p) => p.id === postId);
    if (idx === -1) throw new Error("Publicação não encontrada.");
    const newComment: PostComment = {
      ...comment,
      content: comment.content.trim(),
      id: makeId(),
      createdAt: new Date().toISOString(),
    };
    all[idx] = {
      ...all[idx],
      comments: [...all[idx].comments, newComment],
    };
    savePosts(all);
    return resolveNow(all[idx]);
  },

  /** Remove uma publicação (apenas o próprio autor). */
  async remove(postId: string, userId: string): Promise<void> {
    if (apiEnabled()) {
      await api.del(`/posts/${postId}?userId=${encodeURIComponent(userId)}`);
      return;
    }
    const all = loadPosts().filter(
      (p) => !(p.id === postId && p.authorId === userId),
    );
    savePosts(all);
    await resolveNow(null);
  },
};

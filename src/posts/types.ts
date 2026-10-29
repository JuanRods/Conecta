/**
 * Tipos de domínio do Feed de Publicações (posts).
 *
 * Um Post é uma atualização compartilhada por uma pessoa ou empresa na tela
 * principal da comunidade Conecta Inclusão. O feed é social e inclusivo:
 * textos curtos, reações (curtir) e comentários.
 */

/** Papel do autor exibido no feed (para o selo ao lado do nome). */
export type AuthorRole = "CANDIDATE" | "COMPANY" | "ADMIN";

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: AuthorRole;
  authorHeadline?: string;
  content: string;
  createdAt: string;
  /** IDs dos usuários que curtiram (evita curtida duplicada por pessoa). */
  likedBy: string[];
  comments: PostComment[];
}

/** Dados necessários para criar uma publicação. */
export interface CreatePostInput {
  authorId: string;
  authorName: string;
  authorRole: AuthorRole;
  authorHeadline?: string;
  content: string;
}

export const AUTHOR_ROLE_LABELS: Record<AuthorRole, string> = {
  CANDIDATE: "Candidato(a)",
  COMPANY: "Empresa",
  ADMIN: "Equipe Conecta",
};

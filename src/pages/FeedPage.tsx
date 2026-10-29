import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, dashboardPathForRole } from "../auth/AuthContext";
import { useAnnouncer } from "../accessibility/Announcer";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { postService } from "../posts/postService";
import {
  AUTHOR_ROLE_LABELS,
  type AuthorRole,
  type Post,
} from "../posts/types";
import "./FeedPage.css";

const MAX_LENGTH = 1000;

/** Formata a data de forma relativa, acessível ("há 2 horas", "ontem"...). */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

/**
 * Tela principal de Publicações (feed social da comunidade).
 *
 * Layout de 3 colunas no estilo de rede profissional:
 *   esquerda: cartão de perfil e atalhos
 *   centro:   compositor ("Começar publicação") + lista de publicações
 *   direita:  conteúdo editorial / destaques
 *
 * Toda pessoa autenticada pode publicar, curtir e comentar. As ações são
 * anunciadas por leitor de tela e o feed é atualizado de forma otimista.
 */
export function FeedPage() {
  const { user } = useAuth();
  const { announce } = useAnnouncer();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const composerId = useId();
  const feedHeadingId = useId();

  useEffect(() => {
    let active = true;
    setLoading(true);
    postService.list().then((list) => {
      if (!active) return;
      setPosts(list);
      setLoading(false);
      announce(
        list.length === 1
          ? "1 publicação carregada."
          : `${list.length} publicações carregadas.`,
      );
    });
    return () => {
      active = false;
    };
  }, [announce]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const content = draft.trim();
    if (!content) return;

    setSubmitting(true);
    const created = await postService.create({
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role as AuthorRole,
      content,
    });
    setPosts((prev) => [created, ...prev]);
    setDraft("");
    setSubmitting(false);
    announce("Publicação compartilhada no feed.");
  }

  async function handleToggleLike(post: Post) {
    if (!user) return;
    const liked = post.likedBy.includes(user.id);
    const updated = await postService.toggleLike(post.id, user.id);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? updated : p)));
    announce(liked ? "Curtida removida." : "Publicação curtida.");
  }

  async function handleComment(postId: string, content: string) {
    if (!user || !content.trim()) return;
    const updated = await postService.addComment(postId, {
      authorId: user.id,
      authorName: user.name,
      content,
    });
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    announce("Comentário publicado.");
  }

  async function handleRemove(post: Post) {
    if (!user) return;
    await postService.remove(post.id, user.id);
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    announce("Publicação removida.");
  }

  if (!user) return null;

  const firstName = user.name.split(/\s+/)[0];
  const remaining = MAX_LENGTH - draft.length;

  return (
    <div className="cols-3">
      {/* ---------------- Coluna esquerda: perfil ---------------- */}
      <aside className="cols-3__side" aria-labelledby="feed-perfil-titulo">
        <h2 id="feed-perfil-titulo" className="sr-only">
          Seu perfil
        </h2>
        <div className="profile-card">
          <div className="profile-card__cover" />
          <div className="profile-card__body">
            <Avatar
              name={user.name}
              className="profile-card__avatar"
              decorative
            />
            <h3 className="profile-card__name">{user.name}</h3>
            <p className="profile-card__headline">
              {AUTHOR_ROLE_LABELS[user.role as AuthorRole]}
            </p>
          </div>
          <ul className="profile-card__list">
            <li>
              <Link
                className="profile-card__link"
                to={dashboardPathForRole(user.role)}
              >
                <span>Meu painel</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
            <li>
              <Link className="profile-card__link" to="/vagas">
                <span>Buscar vagas</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* ---------------- Coluna central: feed ---------------- */}
      <div className="cols-3__main">
        <section className="feed" aria-labelledby={feedHeadingId}>
          <h1 id={feedHeadingId} className="feed__title">
            Publicações da comunidade
          </h1>

          {/* Compositor de publicação */}
          <form
            className="composer feed-card"
            onSubmit={handlePublish}
            aria-label="Criar uma publicação"
          >
            <div className="composer__row">
              <Avatar name={user.name} size="sm" decorative />
              <label className="sr-only" htmlFor={composerId}>
                Começar publicação
              </label>
              <textarea
                id={composerId}
                className="composer__input"
                placeholder={`Começar publicação, ${firstName}…`}
                value={draft}
                maxLength={MAX_LENGTH}
                rows={draft ? 4 : 1}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div className="composer__footer">
              <span
                className="composer__count"
                aria-live="polite"
                aria-label={`${remaining} caracteres restantes`}
              >
                {remaining}
              </span>
              <Button
                type="submit"
                variant="primary"
                disabled={!draft.trim() || submitting}
              >
                {submitting ? "Publicando…" : "Publicar"}
              </Button>
            </div>
          </form>

          {/* Estado da lista de publicações (anunciado) */}
          <h2 className="sr-only" aria-live="polite">
            {loading
              ? "Carregando publicações…"
              : posts.length === 0
                ? "Nenhuma publicação ainda"
                : `${posts.length} publicações`}
          </h2>

          {loading && <p className="feed-card">Carregando publicações…</p>}

          {!loading && posts.length === 0 && (
            <p className="feed-card">
              Ainda não há publicações. Seja a primeira pessoa a compartilhar
              algo com a comunidade!
            </p>
          )}

          <ul className="feed__list">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard
                  post={post}
                  currentUserId={user.id}
                  onToggleLike={() => handleToggleLike(post)}
                  onComment={(content) => handleComment(post.id, content)}
                  onRemove={() => handleRemove(post)}
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* ---------------- Coluna direita: destaques ---------------- */}
      <aside
        className="cols-3__side cols-3__side--right"
        aria-labelledby="feed-lateral-titulo"
      >
        <h2 id="feed-lateral-titulo" className="sr-only">
          Destaques da comunidade
        </h2>
        <div className="sidebar-card">
          <h3 className="sidebar-card__title">Em alta no Conecta</h3>
          <ul className="sidebar-list">
            <li>
              Lei de Cotas: direitos de PcD no mercado de trabalho
              <span className="sidebar-list__meta">Direitos · 6 min</span>
            </li>
            <li>
              Como pedir acomodações no processo seletivo
              <span className="sidebar-list__meta">Carreira · 4 min</span>
            </li>
            <li>
              Empresas com selo de acessibilidade estão contratando
              <span className="sidebar-list__meta">Vagas · atualize-se</span>
            </li>
          </ul>
        </div>
        <div className="sidebar-card">
          <h3 className="sidebar-card__title">Boas práticas no feed</h3>
          <ul className="sidebar-list">
            <li>Descreva imagens em palavras quando for relatar algo visual.</li>
            <li>Use linguagem simples e respeitosa com todas as pessoas.</li>
            <li>Compartilhe vagas e conquistas para inspirar a comunidade.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/** Cartão de uma publicação individual, com ações de curtir e comentar. */
function PostCard({
  post,
  currentUserId,
  onToggleLike,
  onComment,
  onRemove,
}: {
  post: Post;
  currentUserId: string;
  onToggleLike: () => void;
  onComment: (content: string) => void;
  onRemove: () => void;
}) {
  const [commentDraft, setCommentDraft] = useState("");
  const [showComments, setShowComments] = useState(false);
  const commentFieldRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const commentsId = useId();

  const liked = post.likedBy.includes(currentUserId);
  const isOwner = post.authorId === currentUserId;
  const likeCount = post.likedBy.length;
  const commentCount = post.comments.length;

  const roleLabel = useMemo(
    () => AUTHOR_ROLE_LABELS[post.authorRole],
    [post.authorRole],
  );

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    const content = commentDraft.trim();
    if (!content) return;
    onComment(content);
    setCommentDraft("");
  }

  function openComments() {
    setShowComments(true);
    // foca o campo após renderizar
    setTimeout(() => commentFieldRef.current?.focus(), 0);
  }

  return (
    <article className="post-card" aria-labelledby={titleId}>
      <header className="post-card__head">
        <Avatar name={post.authorName} decorative />
        <div className="post-card__ident">
          <p className="post-card__author" id={titleId}>
            <span className="post-card__name">{post.authorName}</span>
            <span className="badge badge--neutral post-card__role">
              {roleLabel}
            </span>
          </p>
          {post.authorHeadline && (
            <p className="post-card__headline">{post.authorHeadline}</p>
          )}
          <p className="post-card__time">
            <time dateTime={post.createdAt}>{relativeTime(post.createdAt)}</time>
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            className="post-card__remove"
            onClick={onRemove}
            aria-label="Excluir esta publicação"
            title="Excluir publicação"
          >
            <span aria-hidden="true">🗑️</span>
          </button>
        )}
      </header>

      <p className="post-card__content">{post.content}</p>

      {(likeCount > 0 || commentCount > 0) && (
        <p className="post-card__stats">
          {likeCount > 0 && (
            <span>
              {likeCount} {likeCount === 1 ? "curtida" : "curtidas"}
            </span>
          )}
          {commentCount > 0 && (
            <span>
              {commentCount}{" "}
              {commentCount === 1 ? "comentário" : "comentários"}
            </span>
          )}
        </p>
      )}

      <div className="post-card__actions">
        <button
          type="button"
          className="post-card__action"
          onClick={onToggleLike}
          aria-pressed={liked}
        >
          <span aria-hidden="true">{liked ? "💜" : "🤍"}</span>
          <span>Curtir</span>
        </button>
        <button
          type="button"
          className="post-card__action"
          onClick={openComments}
          aria-expanded={showComments}
          aria-controls={commentsId}
        >
          <span aria-hidden="true">💬</span>
          <span>Comentar</span>
        </button>
      </div>

      {showComments && (
        <div className="post-card__comments" id={commentsId}>
          {post.comments.length > 0 && (
            <ul className="comment-list">
              {post.comments.map((c) => (
                <li key={c.id} className="comment">
                  <Avatar name={c.authorName} size="sm" decorative />
                  <div className="comment__body">
                    <p className="comment__author">{c.authorName}</p>
                    <p className="comment__text">{c.content}</p>
                    <p className="comment__time">
                      <time dateTime={c.createdAt}>
                        {relativeTime(c.createdAt)}
                      </time>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form className="comment-form" onSubmit={submitComment}>
            <label className="sr-only" htmlFor={`${commentsId}-field`}>
              Escrever um comentário
            </label>
            <input
              ref={commentFieldRef}
              id={`${commentsId}-field`}
              className="comment-form__input"
              type="text"
              placeholder="Escreva um comentário respeitoso…"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={!commentDraft.trim()}
            >
              Enviar
            </Button>
          </form>
        </div>
      )}
    </article>
  );
}

/**
 * Página temporária para rotas ainda não implementadas, mantendo a navegação
 * acessível enquanto as próximas fases são construídas.
 */
export function PlaceholderPage({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <section
      aria-labelledby="placeholder-titulo"
      style={{ paddingBlock: "2rem" }}
    >
      <h1 id="placeholder-titulo">{title}</h1>
      <p style={{ color: "var(--color-fg-muted)" }}>
        Esta seção faz parte da <strong>{phase}</strong> do plano de
        implementação.
      </p>
    </section>
  );
}

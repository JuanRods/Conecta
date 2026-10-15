/**
 * Avatar com iniciais (A1): não dependemos de upload de foto, então geramos as
 * iniciais do nome. O elemento é decorativo quando o nome já está visível ao
 * lado — nesse caso passe `decorative` para ocultá-lo de leitores de tela e
 * evitar leitura duplicada.
 */
export function Avatar({
  name,
  size = "md",
  className = "",
  decorative = false,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
  decorative?: boolean;
}) {
  const initials = getInitials(name);
  const classes = [
    "avatar",
    size === "sm" ? "avatar--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      aria-hidden={decorative ? "true" : undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : `Foto de perfil de ${name}`}
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

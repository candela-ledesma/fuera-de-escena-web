import Link from "next/link";

/** Encabezado de sección de la home: filete superior, título y "Ver todas →". */
export function SectionHeading({
  id,
  title,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  href: string;
  /** Nombre accesible del link, p. ej. "Ver todas las críticas". */
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-t border-foreground pt-6">
      <h2 id={id} className="font-display text-[1.75rem] font-medium leading-tight text-foreground sm:text-[2rem]">
        {title}
      </h2>
      <Link
        href={href}
        aria-label={linkLabel}
        className="flex min-h-11 shrink-0 items-center text-xs font-medium uppercase tracking-[0.18em] text-foreground hover:text-primary"
      >
        Ver todas <span aria-hidden="true">&nbsp;→</span>
      </Link>
    </div>
  );
}

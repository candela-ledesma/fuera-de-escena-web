const highlights = [
  {
    title: "Lectura pública",
    description: "Las críticas publicadas se leen sin login, con foco en accesibilidad y SEO.",
  },
  {
    title: "Autora privada",
    description: "Solo la autora puede crear, editar o borrar críticas desde el panel privado.",
  },
  {
    title: "Interacción moderada",
    description: "Comentarios con moderación previa y reacciones públicas deduplicadas.",
  },
];

const stackItems = [
  "Next.js 15 + React 19",
  "Tailwind CSS + shadcn/ui",
  "Supabase Auth, Postgres y Storage",
  "Zod + React Hook Form",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
      <div className="relative flex min-h-[calc(100vh-3rem)] flex-1 overflow-hidden rounded-[2rem] border border-border/80 bg-card/70 shadow-[0_24px_80px_rgba(23,19,17,0.12)] backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,74,47,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(79,90,73,0.14),transparent_34%)]" />

        <div className="relative z-10 flex w-full flex-col">
          <header className="flex items-center justify-between border-b border-border/70 px-6 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">
                Fuera de Escena BB
              </p>
              <p className="mt-1 text-sm text-muted">
                Críticas de teatro desde Bahía Blanca.
              </p>
            </div>

            <div className="rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-muted">
              Base inicial
            </div>
          </header>

          <section className="grid flex-1 gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:py-16">
            <div className="max-w-3xl space-y-8">
              <div className="inline-flex items-center rounded-full border border-border/70 bg-background/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                Sitio editorial de una sola autora
              </div>

              <div className="space-y-5">
                <h1 className="font-display text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                  Críticas de teatro con mirada local y pulso editorial.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                  Una base pensada para publicar obras, moderar comentarios y sostener una experiencia
                  pública clara, accesible y segura desde el primer día.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {stackItems.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <aside className="grid gap-4 rounded-[1.75rem] border border-border/70 bg-background/85 p-5 shadow-[0_18px_50px_rgba(23,19,17,0.08)] sm:p-6">
              <div className="rounded-2xl border border-border/70 bg-card/90 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Alcance inicial
                </p>
                <p className="mt-3 font-display text-3xl leading-tight">
                  Lectura pública, autoría privada y moderación centralizada.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <article key={highlight.title} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                      {highlight.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted">{highlight.description}</p>
                  </article>
                ))}
              </div>
            </aside>
          </section>
        </div>
      </div>
    </main>
  );
}
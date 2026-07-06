import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getPublishedReviews } from "@/features/reviews/queries";

export const revalidate = 0;

export default async function HomePage() {
  const reviews = await getPublishedReviews();

  return (
    <div className="min-h-dvh bg-background">
      <div className="relative h-[min(58vw,520px)] w-full overflow-hidden bg-[#1A0F0A]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="block h-full w-full object-cover opacity-[0.92]"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A0F0A]/5 to-[#1A0F0A]/50" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
          <p className="font-display text-sm italic tracking-[0.15em] text-[#FDF8F5]/80 sm:text-base">
            mirar teatro desde otro lugar
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[60px] max-w-[980px] items-center justify-between gap-4 px-6">
          <a href="#" className="flex items-center gap-3 no-underline">
            <div>
              <div className="font-display text-lg font-semibold tracking-[0.03em] text-foreground">
                Fuera de <span>Escena</span>
              </div>
              <span className="mt-0.5 block text-[0.62rem] font-light uppercase tracking-[0.18em] text-muted">
                @fueradeescenabb
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2">
            <Button asChild size="sm">
              <Link href="/panel">+ Nueva crítica</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[980px] items-center gap-8 px-6 py-8">
          <div>
            <div className="text-base font-medium text-foreground">@fueradeescenabb</div>
            <div className="mt-1 flex gap-6 text-sm text-muted">
              <span>
                <strong className="font-semibold text-foreground">{reviews.length}</strong> críticas
              </span>
              <span>
                <strong className="font-semibold text-foreground">1</strong> por semana
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground">
              <strong className="block font-semibold">Fuera de Escena</strong>
              Críticas, miradas y recomendaciones sobre teatro en Bahía Blanca y la región.
            </p>
            <p className="mt-2 text-xs text-muted">Bahía Blanca · Argentina</p>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[980px] items-center gap-3 px-6 py-2">
          <button className="border-b-2 border-primary py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#9A7830]">
            Críticas teatrales
          </button>
          <div className="flex-1" />
          <input
            placeholder="Buscar obra..."
            className="min-w-[160px] rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted"
          />
        </div>
      </div>

      <main className="mx-auto max-w-[980px] px-5 py-5">
        {reviews.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl italic text-foreground">Todavía no hay críticas publicadas.</p>
            <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/critica/${review.slug}`}
                className="relative aspect-square overflow-hidden bg-[#2A1A14] text-left"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#C9A84C_0%,#8A3F35_38%,#2A1A14_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A05]/90 via-[#1A0A05]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
                  {review.rating ? (
                    <span className="mb-1 block text-[0.6rem] tracking-[1px] text-primary">
                      {"★".repeat(review.rating)}
                    </span>
                  ) : null}
                  <p className="font-display text-lg font-semibold leading-tight text-[#FDF8F5]">
                    {review.title}
                  </p>
                  <p className="mt-0.5 truncate text-[0.66rem] text-[#FDF8F5]/60">
                    {[review.venue, review.categoryName].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border px-8 py-8 text-center">
        <div className="text-xs tracking-[0.12em] text-muted">FUERA DE ESCENA BB · @FUERADEESCENABB</div>
        <Link
          href="/login"
          className="text-[0.66rem] uppercase tracking-[0.18em] text-muted opacity-55 hover:opacity-100 hover:text-[#9A7830]"
        >
          Acceso
        </Link>
      </footer>
    </div>
  );
}

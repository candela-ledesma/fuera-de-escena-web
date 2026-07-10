import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";
import { formatDateEs } from "@/lib/utils";
import { getPublishedReviews } from "@/features/reviews/queries";

export const revalidate = 0;

const INSTAGRAM_URL = "https://www.instagram.com/fueradeescenabb";

function formatEventDate(value: string | null): string | null {
  if (!value) return null;

  return formatDateEs(`${value}T00:00:00`);
}

export default async function HomePage() {
  const [session, reviews] = await Promise.all([auth(), getPublishedReviews()]);
  const isAuthor = Boolean(session?.user);

  return (
    <div className="min-h-dvh bg-background">
      <div className="relative h-[min(38vw,340px)] w-full overflow-hidden bg-[#1A0F0A]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="block h-full w-full object-cover opacity-[0.92]"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A0F0A]/10 to-[#1A0F0A]/60" />
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 px-6 text-center">
          <p className="font-display text-2xl font-semibold tracking-[0.03em] text-[#FDF8F5] sm:text-3xl">
            Fuera de Escena
          </p>
          <p className="font-display text-sm italic tracking-[0.15em] text-[#FDF8F5]/80 sm:text-base">
            mirar teatro desde otro lugar
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <a href="#" className="flex shrink-0 items-center gap-2 no-underline">
              <Image
                src="/brand/logo.png"
                alt="Fuera de Escena"
                width={32}
                height={32}
                priority
                className="size-8 shrink-0 rounded-full border border-border object-cover"
              />
              <span className="hidden font-display text-lg font-semibold tracking-[0.03em] text-foreground sm:inline">
                Fuera de <span>Escena</span>
              </span>
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[0.62rem] font-light uppercase tracking-[0.18em] text-muted hover:text-[#9A7830]"
            >
              @fueradeescenabb
            </a>
          </div>

          {isAuthor ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm">
                <Link href="/panel">Panel de autora</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-6">
          <Image
            src="/brand/logo.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="hidden size-24 shrink-0 rounded-full border border-border object-cover sm:block"
          />
          <div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-sm text-foreground">
                <strong className="font-semibold">{reviews.length}</strong>{" "}
                {reviews.length === 1 ? "crítica" : "críticas"}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">
              Críticas, miradas y recomendaciones sobre teatro en Bahía Blanca y la región.
            </p>
            <p className="mt-2 text-xs text-foreground/70">Bahía Blanca · Argentina</p>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
          <span className="border-b-2 border-primary py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#9A7830]">
            Críticas teatrales
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-8">
        {reviews.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl italic text-foreground">Todavía no hay críticas publicadas.</p>
            <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {reviews.map((review) => {
              const eventDate = formatEventDate(review.eventDate);

              return (
                <Link
                  key={review.id}
                  href={`/critica/${review.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-md bg-[#2A1A14] text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  {review.coverImageUrl ? (
                    <Image
                      src={review.coverImageUrl}
                      alt={review.coverImageAlt ?? review.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#C9A84C_0%,#8A3F35_38%,#2A1A14_100%)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A05]/90 via-[#1A0A05]/25 to-transparent transition-opacity group-hover:from-[#1A0A05]/95" />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
                    {review.rating ? (
                      <span
                        className="mb-1 block text-[0.6rem] tracking-[1px] text-primary"
                        aria-label={`${review.rating} de 5 estrellas`}
                      >
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                    ) : null}
                    <p className="font-display text-lg font-semibold leading-tight text-[#FDF8F5]">
                      {review.title}
                    </p>
                    <p className="mt-0.5 truncate text-[0.66rem] text-[#FDF8F5]/70">
                      {[review.venue, eventDate].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border px-8 py-8 text-center">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs tracking-[0.12em] text-muted hover:text-[#9A7830]"
        >
          FUERA DE ESCENA BB · @FUERADEESCENABB
        </a>
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

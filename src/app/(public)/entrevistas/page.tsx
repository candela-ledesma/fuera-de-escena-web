import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PublicNavTabs } from "@/components/public-nav-tabs";
import { auth } from "@/lib/auth/config";
import { getPublishedReviews } from "@/features/reviews/queries";

export const revalidate = 0;

const INSTAGRAM_URL = "https://www.instagram.com/fueradeescenabb";

export default async function InterviewsPage() {
  const [session, interviews] = await Promise.all([auth(), getPublishedReviews("entrevista")]);
  const isAuthor = Boolean(session?.user);

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
              <Image
                src="/brand/logo.png"
                alt=""
                width={32}
                height={32}
                priority
                className="size-8 shrink-0 rounded-full border border-border object-cover"
              />
              <span className="hidden font-display text-lg font-semibold tracking-[0.03em] text-foreground sm:inline">
                Fuera de <span>Escena</span>
              </span>
            </Link>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-[0.62rem] font-light uppercase tracking-[0.18em] text-muted hover:text-[#6E561F]"
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
                <strong className="font-semibold">{interviews.length}</strong>{" "}
                {interviews.length === 1 ? "entrevista" : "entrevistas"}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">
              Entrevistas y conversaciones con artistas de la escena teatral de Bahía Blanca y la región.
            </p>
            <p className="mt-2 text-xs text-foreground/70">Bahía Blanca · Argentina</p>
          </div>
        </div>
      </section>

      <PublicNavTabs active="/entrevistas" />

      <main className="mx-auto max-w-5xl px-5 py-8">
        {interviews.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl italic text-foreground">Todavía no hay entrevistas publicadas.</p>
            <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {interviews.map((interview) => (
              <Link
                key={interview.id}
                href={`/entrevista/${interview.slug}`}
                className="group relative aspect-square overflow-hidden rounded-md bg-[#2A1A14] text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                {interview.coverImageUrl ? (
                  <Image
                    src={interview.coverImageUrl}
                    alt={interview.coverImageAlt ?? interview.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#C9A84C_0%,#8A3F35_38%,#2A1A14_100%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A05]/90 via-[#1A0A05]/25 to-transparent transition-opacity group-hover:from-[#1A0A05]/95" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
                  <p className="font-display text-lg font-semibold leading-tight text-[#FDF8F5]">
                    {interview.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-12 flex flex-col items-center gap-3 border-t border-border px-8 py-8 text-center">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center text-xs tracking-[0.12em] text-muted hover:text-[#6E561F]"
        >
          FUERA DE ESCENA BB · @FUERADEESCENABB
        </a>
        <Link
          href="/login"
          className="flex min-h-11 items-center text-[0.66rem] uppercase tracking-[0.18em] text-muted hover:text-[#6E561F]"
        >
          Acceso
        </Link>
      </footer>
    </div>
  );
}

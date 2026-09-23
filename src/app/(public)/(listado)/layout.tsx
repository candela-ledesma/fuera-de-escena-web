import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";

const INSTAGRAM_URL = "https://www.instagram.com/fueradeescenabb";

export default async function ListadoLayout({ children }: { children: ReactNode }) {
  const session = await auth();
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

      {children}

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

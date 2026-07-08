import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border/70 px-6">
        <Link
          href="/"
          className="justify-self-start font-display text-sm font-semibold tracking-[0.03em] text-foreground no-underline"
        >
          Fuera de Escena
        </Link>
        <p className="justify-self-center text-sm font-semibold uppercase tracking-[0.24em] text-muted">
          Panel de la autora
        </p>
        <form action={signOut} className="justify-self-end">
          <Button type="submit" variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <main className="px-6 py-8">{children}</main>
    </div>
  );
}

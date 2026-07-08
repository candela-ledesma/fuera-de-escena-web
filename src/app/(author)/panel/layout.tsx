import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";
import { PanelBackLink } from "./panel-back-link";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="grid h-16 grid-cols-[1fr_auto_1fr] items-center border-b border-border/70 px-6">
        <PanelBackLink />
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

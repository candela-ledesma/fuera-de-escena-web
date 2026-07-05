import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/features/auth/actions";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-border/70 px-6 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
          Panel de la autora
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            Cerrar sesión
          </Button>
        </form>
      </header>

      <main className="px-6 py-8">{children}</main>
    </div>
  );
}

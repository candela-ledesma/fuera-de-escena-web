import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

/**
 * Chrome del sitio público. Sin loading.tsx a este nivel: envolvería a los
 * detalles y el streaming fijaría el status 200 antes de notFound().
 * Cada página pone su propio <main>.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-public flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

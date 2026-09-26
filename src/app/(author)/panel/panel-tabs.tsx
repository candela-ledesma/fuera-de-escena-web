import Link from "next/link";

import { cn } from "@/lib/utils";

export type PanelTab = "criticas" | "entrevistas";

const TABS: { value: PanelTab; label: string; href: string }[] = [
  { value: "criticas", label: "Críticas teatrales", href: "/panel" },
  { value: "entrevistas", label: "Entrevistas", href: "/panel?tab=entrevistas" },
];

export function parsePanelTab(value: string | string[] | undefined): PanelTab {
  return value === "entrevistas" ? "entrevistas" : "criticas";
}

/**
 * Tabs del panel como links: la tab activa vive en la URL (?tab=), se
 * resuelve en el servidor y el botón atrás vuelve a la anterior.
 * Subrayado activo en --primary-hover (#9a7830, 3,48:1 sobre el fondo); el
 * texto activo va en el color principal (el dorado no llega a 4,5:1).
 */
export function PanelTabs({ active }: { active: PanelTab }) {
  return (
    <nav aria-label="Secciones del panel" className="flex items-center gap-1 border-b border-border px-3 sm:px-6">
      {TABS.map((tab) => {
        const isActive = tab.value === active;

        return (
          <Link
            key={tab.value}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            scroll={false}
            className={cn(
              "flex min-h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary-hover text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

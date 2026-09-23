"use client";

import { cn } from "@/lib/utils";

export type PanelTab = "criticas" | "entrevistas";

const TABS: { value: PanelTab; label: string }[] = [
  { value: "criticas", label: "Críticas teatrales" },
  { value: "entrevistas", label: "Entrevistas" },
];

export function PanelTabs({
  active,
  onChange,
}: {
  active: PanelTab;
  onChange: (tab: PanelTab) => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border px-3 sm:px-6">
      {TABS.map((tab) => {
        const isActive = tab.value === active;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

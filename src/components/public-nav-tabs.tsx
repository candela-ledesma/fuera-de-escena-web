"use client";

export type PublicTab = "criticas" | "entrevistas";

const TABS: { value: PublicTab; label: string }[] = [
  { value: "criticas", label: "Críticas teatrales" },
  { value: "entrevistas", label: "Entrevistas" },
];

export function PublicNavTabs({
  active,
  onChange,
}: {
  active: PublicTab;
  onChange: (tab: PublicTab) => void;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
        {TABS.map((tab) => {
          const isActive = tab.value === active;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange(tab.value)}
              className={
                isActive
                  ? "border-b-2 border-primary py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6E561F]"
                  : "py-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted hover:text-[#6E561F]"
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

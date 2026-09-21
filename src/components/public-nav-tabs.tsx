import Link from "next/link";

const TABS = [
  { href: "/", label: "Críticas teatrales" },
  { href: "/entrevistas", label: "Entrevistas" },
];

export function PublicNavTabs({ active }: { active: "/" | "/entrevistas" }) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2">
        {TABS.map((tab) => {
          const isActive = tab.href === active;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                isActive
                  ? "border-b-2 border-primary py-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6E561F]"
                  : "py-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted hover:text-[#6E561F]"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

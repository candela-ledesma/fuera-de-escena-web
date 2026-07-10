import Link from "next/link";

import { Card } from "@/components/ui/card";

type DashboardStatsProps = {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
  mostViewed: { title: string; slug: string; viewCount: number } | null;
};

export function DashboardStats({ total, published, drafts, totalViews, mostViewed }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
      <Card data-testid="stat-card" className="gap-1 p-3 sm:p-5">
        <span className="text-xs uppercase leading-tight tracking-wide text-muted-foreground">Críticas</span>
        <span className="font-display text-2xl text-foreground sm:text-3xl mt-1">{total}</span>
      </Card>

      <Card data-testid="stat-card" className="gap-1 p-3 sm:p-5">
        <span className="text-xs uppercase leading-tight tracking-wide text-muted-foreground">Publicadas / borradores</span>
        <span className="font-display text-2xl text-foreground sm:text-3xl mt-1">
          {published} <span className="text-base text-muted-foreground">/ {drafts}</span>
        </span>
      </Card>

      <Card data-testid="stat-card" className="gap-1 p-3 sm:p-5">
        <span className="text-xs uppercase leading-tight tracking-wide text-muted-foreground">Vistas totales</span>
        <span className="font-display text-2xl text-foreground sm:text-3xl mt-1">{totalViews}</span>
      </Card>

      <Card data-testid="stat-card" className="gap-1 p-3 sm:p-5">
        <span className="text-xs uppercase leading-tight tracking-wide text-muted-foreground">Más vista</span>
        {mostViewed ? (
          <Link
            href={`/panel/criticas/${mostViewed.slug}`}
            className="truncate font-display text-lg text-foreground hover:text-primary mt-1"
            title={mostViewed.title}
          >
            {mostViewed.title}
          </Link>
        ) : (
          <span className="font-display text-lg text-muted-foreground mt-1">Sin datos aún</span>
        )}
      </Card>
    </div>
  );
}

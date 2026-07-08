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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="gap-1 p-4">
        <span className="min-h-9 text-xs uppercase leading-tight tracking-wide text-muted-foreground">Críticas</span>
        <span className="font-display text-3xl text-foreground">{total}</span>
      </Card>

      <Card className="gap-1 p-4">
        <span className="min-h-9 text-xs uppercase leading-tight tracking-wide text-muted-foreground">Publicadas / borradores</span>
        <span className="font-display text-3xl text-foreground">
          {published} <span className="text-lg text-muted-foreground">/ {drafts}</span>
        </span>
      </Card>

      <Card className="gap-1 p-4">
        <span className="min-h-9 text-xs uppercase leading-tight tracking-wide text-muted-foreground">Vistas totales</span>
        <span className="font-display text-3xl text-foreground">{totalViews}</span>
      </Card>

      <Card className="gap-1 p-4">
        <span className="min-h-9 text-xs uppercase leading-tight tracking-wide text-muted-foreground">Más vista</span>
        {mostViewed ? (
          <Link
            href={`/panel/criticas/${mostViewed.slug}`}
            className="truncate font-display text-lg text-foreground hover:text-primary"
            title={mostViewed.title}
          >
            {mostViewed.title}
          </Link>
        ) : (
          <span className="font-display text-lg text-muted-foreground">Sin datos aún</span>
        )}
      </Card>
    </div>
  );
}

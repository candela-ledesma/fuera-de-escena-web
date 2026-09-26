import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/features/reviews/components/dashboard-stats";
import { ReviewList } from "@/features/reviews/components/review-list";
import { InterviewList } from "@/features/interviews/components/interview-list";

import { PanelTabs } from "./panel-tabs";

type Stats = {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
  mostViewed: { title: string; slug: string; viewCount: number } | null;
};

type Props =
  | { tab: "criticas"; stats: Stats; items: Parameters<typeof ReviewList>[0]["reviews"] }
  | { tab: "entrevistas"; stats: Stats; items: Parameters<typeof InterviewList>[0]["interviews"] };

export function PanelListing(props: Props) {
  const isCriticas = props.tab === "criticas";

  return (
    <>
      <div className="-mx-6">
        <PanelTabs active={props.tab} />
      </div>

      <div className="space-y-6 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{isCriticas ? "Críticas" : "Entrevistas"}</h1>
          {props.items.length > 0 ? (
            <Button asChild>
              <Link href={isCriticas ? "/panel/criticas/nueva" : "/panel/entrevistas/nueva"}>
                {isCriticas ? "Escribir una crítica" : "Escribir una entrevista"}
              </Link>
            </Button>
          ) : null}
        </div>

        {props.tab === "criticas" ? (
          <>
            <DashboardStats {...props.stats} />
            <ReviewList reviews={props.items} />
          </>
        ) : (
          <>
            <DashboardStats
              {...props.stats}
              totalLabel="Entrevistas"
              editHref={(slug) => `/panel/entrevistas/${slug}`}
            />
            <InterviewList interviews={props.items} />
          </>
        )}
      </div>
    </>
  );
}

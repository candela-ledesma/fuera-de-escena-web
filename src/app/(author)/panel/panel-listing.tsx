"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/features/reviews/components/dashboard-stats";
import { ReviewList } from "@/features/reviews/components/review-list";
import { InterviewList } from "@/features/interviews/components/interview-list";

import { PanelTabs, type PanelTab } from "./panel-tabs";

type Stats = {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
  mostViewed: { title: string; slug: string; viewCount: number } | null;
};

const SAVED_MESSAGES: Record<PanelTab, Record<string, string>> = {
  criticas: { created: "Crítica creada.", updated: "Cambios guardados." },
  entrevistas: { created: "Entrevista creada.", updated: "Cambios guardados." },
};

export function PanelListing({
  reviewStats,
  reviews,
  interviewStats,
  interviews,
}: {
  reviewStats: Stats;
  reviews: Parameters<typeof ReviewList>[0]["reviews"];
  interviewStats: Stats;
  interviews: Parameters<typeof InterviewList>[0]["interviews"];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTab: PanelTab = searchParams.get("tab") === "entrevistas" ? "entrevistas" : "criticas";
  const [active, setActive] = useState<PanelTab>(initialTab);

  useEffect(() => {
    const saved = searchParams.get("saved");
    if (!saved) return;

    const tabFromUrl: PanelTab = searchParams.get("tab") === "entrevistas" ? "entrevistas" : "criticas";
    toast.success(SAVED_MESSAGES[tabFromUrl][saved] ?? "Guardado.");
    router.replace(tabFromUrl === "entrevistas" ? "/panel?tab=entrevistas" : "/panel", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleTabChange(tab: PanelTab) {
    setActive(tab);
    router.replace(tab === "entrevistas" ? "/panel?tab=entrevistas" : "/panel", { scroll: false });
  }

  const isCriticas = active === "criticas";

  return (
    <>
      <div className="-mx-6">
        <PanelTabs active={active} onChange={handleTabChange} />
      </div>

      <div className="space-y-6 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{isCriticas ? "Críticas" : "Entrevistas"}</h1>
          {isCriticas ? (
            reviews.length > 0 ? (
              <Button asChild>
                <Link href="/panel/criticas/nueva">Escribir una crítica</Link>
              </Button>
            ) : null
          ) : interviews.length > 0 ? (
            <Button asChild>
              <Link href="/panel/entrevistas/nueva">Escribir una entrevista</Link>
            </Button>
          ) : null}
        </div>

        {isCriticas ? (
          <>
            <DashboardStats {...reviewStats} />
            <ReviewList reviews={reviews} />
          </>
        ) : (
          <>
            <DashboardStats
              {...interviewStats}
              totalLabel="Entrevistas"
              editHref={(slug) => `/panel/entrevistas/${slug}`}
            />
            <InterviewList interviews={interviews} />
          </>
        )}
      </div>
    </>
  );
}

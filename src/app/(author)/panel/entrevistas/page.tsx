import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";
import { DashboardStats } from "@/features/reviews/components/dashboard-stats";
import { getAuthorReviewStats, getReviewsByAuthor } from "@/features/reviews/queries";
import { InterviewList } from "@/features/interviews/components/interview-list";
import { InterviewSavedToast } from "@/features/interviews/components/saved-toast";
import { PanelTabs } from "../panel-tabs";

export const metadata: Metadata = {
  title: "Panel · Entrevistas",
};

export default async function InterviewsPanelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [stats, interviews] = await Promise.all([
    getAuthorReviewStats(session.user.id, "entrevista"),
    getReviewsByAuthor(session.user.id, "entrevista"),
  ]);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <InterviewSavedToast />
      </Suspense>
      <PanelTabs />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Entrevistas</h1>
        {interviews.length > 0 ? (
          <Button asChild>
            <Link href="/panel/entrevistas/nueva">Escribir una entrevista</Link>
          </Button>
        ) : null}
      </div>

      <DashboardStats
        {...stats}
        totalLabel="Entrevistas"
        editHref={(slug) => `/panel/entrevistas/${slug}`}
      />

      <InterviewList interviews={interviews} />
    </div>
  );
}

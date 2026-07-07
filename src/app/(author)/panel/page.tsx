import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";
import { DashboardStats } from "@/features/reviews/components/dashboard-stats";
import { ReviewList } from "@/features/reviews/components/review-list";
import { SavedToast } from "@/features/reviews/components/saved-toast";
import { getAuthorReviewStats, getReviewsByAuthor } from "@/features/reviews/queries";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function PanelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [stats, reviews] = await Promise.all([
    getAuthorReviewStats(session.user.id),
    getReviewsByAuthor(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Críticas</h1>
        <Button asChild>
          <Link href="/panel/criticas/nueva">Nueva crítica</Link>
        </Button>
      </div>

      <DashboardStats {...stats} />

      <ReviewList reviews={reviews} />
    </div>
  );
}

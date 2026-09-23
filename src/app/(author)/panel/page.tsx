import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth/config";
import { getAuthorReviewStats, getReviewsByAuthor } from "@/features/reviews/queries";

import { PanelListing } from "./panel-listing";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function PanelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [reviewStats, reviews, interviewStats, interviews] = await Promise.all([
    getAuthorReviewStats(session.user.id, "critica"),
    getReviewsByAuthor(session.user.id, "critica"),
    getAuthorReviewStats(session.user.id, "entrevista"),
    getReviewsByAuthor(session.user.id, "entrevista"),
  ]);

  return (
    <Suspense fallback={null}>
      <PanelListing
        reviewStats={reviewStats}
        reviews={reviews}
        interviewStats={interviewStats}
        interviews={interviews}
      />
    </Suspense>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/config";
import { ReviewList } from "@/features/reviews/components/review-list";
import { getReviewsByAuthor } from "@/features/reviews/queries";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function PanelPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const reviews = await getReviewsByAuthor(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Críticas</h1>
        <Button asChild>
          <Link href="/panel/criticas/nueva">Nueva crítica</Link>
        </Button>
      </div>

      <ReviewList reviews={reviews} />
    </div>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { createReview } from "@/features/reviews/actions";
import { getCategories } from "@/features/reviews/queries";

export const metadata: Metadata = {
  title: "Nueva crítica",
};

export default async function NewReviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Nueva crítica</h1>
      <ReviewForm categories={categories} action={createReview} submitLabel="Crear crítica" />
    </div>
  );
}

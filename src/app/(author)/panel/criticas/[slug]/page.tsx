import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { updateReviewAction } from "@/features/reviews/actions";
import { getCategories, getReviewBySlugForAuthor, getReviewTagNames } from "@/features/reviews/queries";

export const metadata: Metadata = {
  title: "Editar crítica",
};

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [review, categories] = await Promise.all([
    getReviewBySlugForAuthor(slug, session.user.id),
    getCategories(),
  ]);

  if (!review) {
    notFound();
  }

  const tagNames = await getReviewTagNames(review.id);
  const boundAction = updateReviewAction.bind(null, slug);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar crítica</h1>
      <ReviewForm
        categories={categories}
        action={boundAction}
        submitLabel="Guardar cambios"
        defaults={{
          title: review.title,
          venue: review.venue ?? "",
          eventDate: review.event_date ?? "",
          categoryId: review.category_id ?? "",
          rating: review.rating ? String(review.rating) : "",
          body: review.body,
          tags: tagNames.join(", "),
        }}
      />
    </div>
  );
}

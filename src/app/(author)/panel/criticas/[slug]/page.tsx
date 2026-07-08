import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { ReviewForm } from "@/features/reviews/components/review-form";
import { updateReviewAction } from "@/features/reviews/actions";
import {
  getCategories,
  getReviewBySlugForAuthor,
  getReviewImages,
  getReviewTagNames,
} from "@/features/reviews/queries";

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

  const [tagNames, images] = await Promise.all([
    getReviewTagNames(review.id),
    getReviewImages(review.id),
  ]);
  const boundAction = updateReviewAction.bind(null, slug);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar crítica</h1>
      <ReviewForm
        categories={categories}
        action={boundAction}
        submitLabel="Guardar cambios"
        status={review.status}
        reviewId={review.id}
        reviewSlug={review.slug}
        defaults={{
          title: review.title,
          venue: review.venue ?? "",
          eventDate: review.eventDate ?? "",
          categoryId: review.categoryId ?? "",
          rating: review.rating ? String(review.rating) : "",
          contentJson: review.contentJson ?? { type: "doc", content: [{ type: "paragraph", content: [] }] },
          tags: tagNames.join(", "),
          images: images.map((image) => ({
            storagePath: image.storagePath,
            altText: image.altText,
            isCover: image.isCover,
          })),
        }}
      />
    </div>
  );
}

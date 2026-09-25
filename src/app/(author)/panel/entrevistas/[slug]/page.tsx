import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { InterviewForm } from "@/features/interviews/components/interview-form";
import { updateInterviewAction } from "@/features/interviews/actions";
import {
  getReviewBySlugForAuthor,
  getReviewImages,
  getReviewTagNames,
} from "@/features/reviews/queries";

export const metadata: Metadata = {
  title: "Editar entrevista",
};

export default async function EditInterviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const interview = await getReviewBySlugForAuthor(slug, session.user.id, "entrevista");

  if (!interview) {
    notFound();
  }

  const [tagNames, images] = await Promise.all([
    getReviewTagNames(interview.id),
    getReviewImages(interview.id),
  ]);
  const boundAction = updateInterviewAction.bind(null, slug);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Editar entrevista</h1>
      <InterviewForm
        action={boundAction}
        submitLabel="Guardar cambios"
        status={interview.status}
        interviewId={interview.id}
        updatedAt={interview.updatedAt.toISOString()}
        interviewSlug={interview.slug}
        defaults={{
          title: interview.title,
          summary: interview.summary ?? "",
          contentJson: interview.contentJson ?? { type: "doc", content: [{ type: "paragraph", content: [] }] },
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

import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { deleteReviewAction, setReviewStatusAction } from "../actions";

type ReviewListItem = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  rating: number | null;
  venue: string | null;
  eventDate: string | null;
  updatedAt: Date;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

export function ReviewList({ reviews }: { reviews: ReviewListItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay críticas cargadas.</p>;
  }

  return (
    <ul className="grid gap-4">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
              {review.coverImageUrl ? (
                <Image
                  src={review.coverImageUrl}
                  alt={review.coverImageAlt ?? review.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{review.title}</h3>
                <Badge variant={review.status === "published" ? "default" : "secondary"}>
                  {review.status === "published" ? "Publicada" : "Borrador"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.venue ? `${review.venue} · ` : ""}
                {review.rating ? `${review.rating}★` : "Sin puntaje"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {review.status === "published" ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/critica/${review.slug}`} target="_blank" rel="noopener noreferrer">
                  Ver publicación
                </Link>
              </Button>
            ) : null}

            <Button asChild variant="outline" size="sm">
              <Link href={`/panel/criticas/${review.slug}`}>Editar</Link>
            </Button>

            <form
              action={async () => {
                "use server";
                await setReviewStatusAction(
                  review.slug,
                  review.status === "published" ? "draft" : "published",
                );
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                {review.status === "published" ? "Pasar a borrador" : "Publicar"}
              </Button>
            </form>

            <form
              action={async () => {
                "use server";
                await deleteReviewAction(review.slug);
              }}
            >
              <Button type="submit" variant="destructive" size="sm">
                Borrar
              </Button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

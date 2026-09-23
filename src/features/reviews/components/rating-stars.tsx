import { cn } from "@/lib/utils";

/** Puntaje de solo lectura. El input del panel es StarRating. */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${rating} de 5 estrellas`}
      className={cn("inline-flex text-sm leading-none tracking-[0.12em]", className)}
    >
      <span aria-hidden="true" className="text-primary">
        {"★".repeat(rating)}
      </span>
      <span aria-hidden="true" className="text-border">
        {"★".repeat(5 - rating)}
      </span>
    </span>
  );
}

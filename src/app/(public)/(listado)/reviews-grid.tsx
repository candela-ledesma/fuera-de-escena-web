import Image from "next/image";
import Link from "next/link";

import { formatDateEs } from "@/lib/utils";

type GridItem = {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  eventDate: string | null;
  rating: number | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
};

function formatEventDate(value: string | null): string | null {
  if (!value) return null;

  return formatDateEs(`${value}T00:00:00`);
}

export function ReviewsGrid({
  items,
  basePath,
  emptyMessage,
}: {
  items: GridItem[];
  basePath: "/critica" | "/entrevista";
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl italic text-foreground">{emptyMessage}</p>
        <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const eventDate = formatEventDate(item.eventDate);

        return (
          <Link
            key={item.id}
            href={`${basePath}/${item.slug}`}
            className="group relative aspect-square overflow-hidden rounded-md bg-[#2A1A14] text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            {item.coverImageUrl ? (
              <Image
                src={item.coverImageUrl}
                alt={item.coverImageAlt ?? item.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#C9A84C_0%,#8A3F35_38%,#2A1A14_100%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A05]/90 via-[#1A0A05]/25 to-transparent transition-opacity group-hover:from-[#1A0A05]/95" />
            <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
              {item.rating ? (
                <span
                  className="mb-1 block text-[0.6rem] tracking-[1px] text-primary"
                  aria-label={`${item.rating} de 5 estrellas`}
                >
                  {"★".repeat(item.rating)}
                  {"☆".repeat(5 - item.rating)}
                </span>
              ) : null}
              <p className="font-display text-lg font-semibold leading-tight text-[#FDF8F5]">{item.title}</p>
              <p className="mt-0.5 truncate text-[0.66rem] text-[#FDF8F5]/70">
                {[item.venue, eventDate].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

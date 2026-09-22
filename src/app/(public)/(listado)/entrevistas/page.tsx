import Image from "next/image";
import Link from "next/link";

import { PublicNavTabs } from "@/components/public-nav-tabs";
import { getPublishedReviews } from "@/features/reviews/queries";

export const revalidate = 0;

export default async function InterviewsPage() {
  const interviews = await getPublishedReviews("entrevista");

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-6">
          <Image
            src="/brand/logo.png"
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="hidden size-24 shrink-0 rounded-full border border-border object-cover sm:block"
          />
          <div>
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="text-sm text-foreground">
                <strong className="font-semibold">{interviews.length}</strong>{" "}
                {interviews.length === 1 ? "entrevista" : "entrevistas"}
              </span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground">
              Entrevistas y conversaciones con artistas de la escena teatral de Bahía Blanca y la región.
            </p>
            <p className="mt-2 text-xs text-foreground/70">Bahía Blanca · Argentina</p>
          </div>
        </div>
      </section>

      <PublicNavTabs />

      <main className="mx-auto max-w-5xl px-5 py-8">
        {interviews.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-xl italic text-foreground">Todavía no hay entrevistas publicadas.</p>
            <p className="mt-2 text-sm text-muted">Volvé pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {interviews.map((interview) => (
              <Link
                key={interview.id}
                href={`/entrevista/${interview.slug}`}
                className="group relative aspect-square overflow-hidden rounded-md bg-[#2A1A14] text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
              >
                {interview.coverImageUrl ? (
                  <Image
                    src={interview.coverImageUrl}
                    alt={interview.coverImageAlt ?? interview.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#C9A84C_0%,#8A3F35_38%,#2A1A14_100%)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0A05]/90 via-[#1A0A05]/25 to-transparent transition-opacity group-hover:from-[#1A0A05]/95" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
                  <p className="font-display text-lg font-semibold leading-tight text-[#FDF8F5]">
                    {interview.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

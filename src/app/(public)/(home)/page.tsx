import { AboutBand } from "@/components/site/about-band";
import { Container } from "@/components/site/container";
import { EmptyState } from "@/components/site/empty-state";
import { TaglineBar } from "@/components/site/tagline-bar";
import { ReviewGrid } from "@/features/reviews/components/review-grid";
import { ReviewHero } from "@/features/reviews/components/review-hero";
import { SectionHeading } from "@/features/reviews/components/section-heading";
import { getPublishedReviews } from "@/features/reviews/queries";
import { SITE } from "@/lib/site-config";

export const revalidate = 0;

const RECENT_REVIEWS_COUNT = 6;
const HOME_INTERVIEWS_COUNT = 3;

export default async function HomePage() {
  const [reviews, interviews] = await Promise.all([
    // El hero + las siguientes, sin repetir la del hero.
    getPublishedReviews("critica", { limit: 1 + RECENT_REVIEWS_COUNT }),
    getPublishedReviews("entrevista", { limit: HOME_INTERVIEWS_COUNT }),
  ]);
  const [latest, ...recent] = reviews;

  return (
    <main>
      <h1 className="sr-only">{SITE.fullName}</h1>
      <TaglineBar />

      <Container className="pt-10 md:pt-[72px]">
        {latest ? <ReviewHero review={latest} /> : <EmptyState message="Todavía no hay críticas publicadas." />}

        {recent.length > 0 ? (
          <section aria-labelledby="criticas-recientes" className="mt-16 md:mt-[88px]">
            <SectionHeading
              id="criticas-recientes"
              title="Críticas recientes"
              href="/critica"
              linkLabel="Ver todas las críticas"
            />
            <div className="mt-8">
              <ReviewGrid items={recent} kind="critica" labelledBy="criticas-recientes" />
            </div>
          </section>
        ) : null}

        {interviews.length > 0 ? (
          <section aria-labelledby="entrevistas" className="mt-16 md:mt-[88px]">
            <SectionHeading
              id="entrevistas"
              title="Entrevistas"
              href="/entrevista"
              linkLabel="Ver todas las entrevistas"
            />
            <div className="mt-8">
              <ReviewGrid items={interviews} kind="entrevista" labelledBy="entrevistas" />
            </div>
          </section>
        ) : null}
      </Container>

      <div className="mt-20 md:mt-24">
        <AboutBand />
      </div>
    </main>
  );
}

import { getPublishedReviews } from "@/features/reviews/queries";

import { ListadoTabs } from "./listado-tabs";

export const revalidate = 0;

export default async function HomePage() {
  const [reviews, interviews] = await Promise.all([
    getPublishedReviews("critica"),
    getPublishedReviews("entrevista"),
  ]);

  return (
    <>
      <div className="relative h-[min(38vw,340px)] w-full overflow-hidden bg-[#1A0F0A]">
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="block h-full w-full object-cover opacity-[0.92]"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A0F0A]/10 to-[#1A0F0A]/60" />
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 px-6 text-center">
          <p className="font-display text-2xl font-semibold tracking-[0.03em] text-[#FDF8F5] sm:text-3xl">
            Fuera de Escena
          </p>
          <p className="font-display text-sm italic tracking-[0.15em] text-[#FDF8F5]/80 sm:text-base">
            mirar teatro desde otro lugar
          </p>
        </div>
      </div>

      <ListadoTabs reviews={reviews} interviews={interviews} />
    </>
  );
}

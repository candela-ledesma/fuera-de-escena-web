import { Container } from "@/components/site/container";

// Solo envuelve a la home (grupo (home)): no afecta el status de los detalles.
export default function HomeLoading() {
  return (
    <main aria-busy="true" className="animate-pulse">
      <div className="border-b border-border">
        <Container className="flex h-16 items-center">
          <div className="h-4 w-64 rounded bg-border" />
        </Container>
      </div>

      <Container className="pt-10 md:pt-[72px]">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="aspect-[16/10] rounded-[4px] bg-border lg:col-span-7" />
          <div className="space-y-4 lg:col-span-5">
            <div className="h-3 w-24 rounded bg-border" />
            <div className="h-12 w-full rounded bg-border" />
            <div className="h-4 w-2/3 rounded bg-border" />
            <div className="h-16 w-full rounded bg-border" />
          </div>
        </div>

        <div className="mt-16 grid gap-x-12 gap-y-14 border-t border-border pt-14 md:mt-[88px] md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="aspect-[16/10] rounded-[4px] bg-border" />
              <div className="h-3 w-32 rounded bg-border" />
              <div className="h-6 w-3/4 rounded bg-border" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}

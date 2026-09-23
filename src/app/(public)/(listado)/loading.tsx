import { ListadoSkeleton } from "./listado-skeleton";

export default function HomeLoading() {
  return (
    <>
      <div className="h-[min(38vw,340px)] w-full animate-pulse bg-[#1A0F0A]" />
      <ListadoSkeleton />
    </>
  );
}

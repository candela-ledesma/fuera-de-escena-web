import { cn } from "@/lib/utils";

/** Firma "por [autora]". Si la autora no tiene displayName, no se muestra. */
export function Byline({ name, className }: { name: string | null; className?: string }) {
  if (!name?.trim()) return null;

  return <p className={cn("font-display italic text-muted-strong", className)}>por {name}</p>;
}

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Contenedor del sitio público: 16px de gutter en mobile, 120px en desktop. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-[120px]", className)}>{children}</div>;
}

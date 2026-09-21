import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function reviewPublicPath(kind: "critica" | "entrevista", slug: string): string {
  return kind === "entrevista" ? `/entrevista/${slug}` : `/critica/${slug}`;
}

export function formatDateEs(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
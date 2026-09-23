import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function reviewPublicPath(kind: "critica" | "entrevista", slug: string): string {
  return kind === "entrevista" ? `/entrevista/${slug}` : `/critica/${slug}`;
}

/**
 * Fecha de función (columna `date`, "YYYY-MM-DD", sin hora). Se interpreta en
 * UTC para que el día no se corra según la zona horaria del servidor.
 * - "long":  "11 de agosto de 2026" (detalle, hero)
 * - "short": "13 jul 2026" (cards)
 */
export function formatEventDate(value: string | null, style: "long" | "short" = "long"): string | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (Number.isNaN(date.getTime())) return null;

  if (style === "long") {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";

  return `${part("day")} ${part("month").replace(".", "")} ${part("year")}`;
}

export function formatDateEs(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
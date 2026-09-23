import type { ComponentProps } from "react";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { MAX_SUMMARY_LENGTH } from "../schema";

/**
 * Bajada: texto corto que se muestra en la home en lugar de un recorte del
 * cuerpo. Opcional en borradores, obligatoria para publicar.
 */
export function SummaryField({
  length,
  error,
  className,
  ...textareaProps
}: Omit<ComponentProps<"textarea">, "id" | "maxLength"> & {
  length: number;
  error?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor="summary" className="text-xs">
          Bajada
        </Label>
        <span id="summary-count" className="text-xs text-muted-foreground" aria-live="polite">
          {length}/{MAX_SUMMARY_LENGTH}
        </span>
      </div>
      <Textarea
        id="summary"
        rows={2}
        maxLength={MAX_SUMMARY_LENGTH}
        placeholder="Una o dos líneas que presenten la obra. Obligatoria para publicar."
        aria-invalid={Boolean(error)}
        aria-describedby="summary-count"
        className="resize-none font-display text-lg italic md:text-lg"
        {...textareaProps}
      />
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

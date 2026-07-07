"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { toggleReaction } from "../actions";
import { REACTION_LABELS, REACTION_TYPES } from "../schema";

type ReactionType = (typeof REACTION_TYPES)[number];
type ReactionCounts = Partial<Record<ReactionType, number>>;

const REACTION_TEXT_LABELS: Record<ReactionType, string> = {
  like: "Me gusta",
  love: "Me encanta",
  wow: "Me sorprende",
  applause: "Aplauso",
};

export function ReactionButtons({
  reviewId,
  reviewSlug,
  counts,
  activeType,
}: {
  reviewId: string;
  reviewSlug: string;
  counts: ReactionCounts;
  activeType: ReactionType | null;
}) {
  const [isPending, startTransition] = useTransition();
  // La base es siempre la prop más reciente del Server Component, que se
  // actualiza por el revalidatePath que hace la propia Server Action. No
  // agregar router.refresh() acá: sería una segunda fuente de invalidación
  // compitiendo con la primera, y produce el doble salto visual del contador
  // (cada una resuelve en un tick distinto, así que React pinta dos veces
  // con valores intermedios antes de asentarse en el real).
  const [optimisticState, setOptimisticState] = useOptimistic(
    { counts, activeType },
    (state, toggledType: ReactionType) => {
      const nextCounts = { ...state.counts };

      if (state.activeType) {
        const previousCount = nextCounts[state.activeType] ?? 0;
        nextCounts[state.activeType] = Math.max(0, previousCount - 1);
      }

      const isTurningOff = state.activeType === toggledType;

      if (!isTurningOff) {
        const currentCount = nextCounts[toggledType] ?? 0;
        nextCounts[toggledType] = currentCount + 1;
      }

      return {
        counts: nextCounts,
        activeType: isTurningOff ? null : toggledType,
      };
    },
  );

  // Bloqueamos clicks concurrentes con una ref (no alcanza con `isPending`:
  // React tarda un tick en reflejarlo, y un click muy rápido después del
  // primero puede colarse antes de ese re-render). Sin este guard, el
  // reducer de useOptimistic encadena sobre el estado optimista anterior
  // en vez del real, y el contador puede pasar por valores intermedios
  // incorrectos (ej. 1 -> 2 -> 0) antes de asentarse.
  const isTogglingRef = useRef(false);

  function handleToggle(type: ReactionType) {
    if (isTogglingRef.current) {
      return;
    }

    isTogglingRef.current = true;

    startTransition(async () => {
      try {
        setOptimisticState(type);
        await toggleReaction(reviewSlug, reviewId, type);
      } catch {
        toast.error("No se pudo registrar tu reacción.");
      } finally {
        isTogglingRef.current = false;
      }
    });
  }

  const totalReactions = REACTION_TYPES.reduce(
    (sum, type) => sum + (optimisticState.counts[type] ?? 0),
    0,
  );

  return (
    <div>
      <p className="font-display text-lg text-foreground">¿Qué te pareció la obra?</p>
      <p className="mt-1 text-sm text-muted">
        Tocá para reaccionar · tocá de nuevo para sacar tu reacción
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Reaccionar a esta crítica">
        {REACTION_TYPES.map((type) => {
          const isActive = optimisticState.activeType === type;
          const count = optimisticState.counts[type] ?? 0;
          const textLabel = REACTION_TEXT_LABELS[type];

          return (
            <button
              key={type}
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(type)}
              aria-pressed={isActive}
              aria-label={count > 0 ? `${textLabel} · ${count}` : textLabel}
              className={cn(
                "group flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "motion-safe:active:scale-95",
                isActive
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "border-border bg-transparent text-muted hover:border-accent hover:bg-accent/40",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "transition-transform motion-safe:duration-200",
                  isActive && "motion-safe:scale-125",
                )}
              >
                {REACTION_LABELS[type]}
              </span>
              <span>{textLabel}</span>
              {count > 0 ? <span>{count}</span> : null}
            </button>
          );
        })}
      </div>

      {totalReactions > 0 ? (
        <p className="mt-3 text-sm text-muted">
          {totalReactions === 1
            ? "1 persona reaccionó"
            : `${totalReactions} personas reaccionaron`}
        </p>
      ) : null}
    </div>
  );
}

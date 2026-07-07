"use client";

import { useOptimistic, useRef, useTransition } from "react";

import { cn } from "@/lib/utils";

import { toggleReaction } from "../actions";
import { REACTION_LABELS, REACTION_TYPES } from "../schema";

type ReactionType = (typeof REACTION_TYPES)[number];
type ReactionCounts = Partial<Record<ReactionType, number>>;

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
      } finally {
        isTogglingRef.current = false;
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Reaccionar a esta crítica">
      {REACTION_TYPES.map((type) => {
        const isActive = optimisticState.activeType === type;
        const count = optimisticState.counts[type] ?? 0;

        return (
          <button
            key={type}
            type="button"
            disabled={isPending}
            onClick={() => handleToggle(type)}
            aria-pressed={isActive}
            aria-label={`${REACTION_LABELS[type]} — ${count} ${count === 1 ? "reacción" : "reacciones"}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "border-primary bg-accent/40 text-foreground"
                : "border-border bg-secondary/50 text-muted-foreground hover:border-primary/60",
            )}
          >
            <span aria-hidden="true">{REACTION_LABELS[type]}</span>
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

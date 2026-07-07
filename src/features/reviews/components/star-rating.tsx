"use client";

import { useId, useRef, useState } from "react";
import { Star } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const RATING_VALUES = [1, 2, 3, 4, 5];

export function StarRating({
  value,
  onChange,
}: {
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [focusValue, setFocusValue] = useState(value ?? 1);
  const labelId = useId();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const displayValue = hoverValue ?? value ?? 0;

  function focusIndex(index: number) {
    const clamped = Math.min(Math.max(index, 0), RATING_VALUES.length - 1);
    const nextValue = RATING_VALUES[clamped];
    setFocusValue(nextValue);
    buttonRefs.current[clamped]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      focusIndex(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      focusIndex(index - 1);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label id={labelId}>Valoración (1 a 5)</Label>
        <span className="text-sm text-muted-foreground">
          {value ? `${value} / 5` : "Sin puntuar"}
        </span>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex items-center gap-1"
        onMouseLeave={() => setHoverValue(null)}
      >
        {RATING_VALUES.map((ratingValue, index) => {
          const isChecked = value === ratingValue;
          const isTabbable = ratingValue === (value ?? focusValue);

          return (
            <button
              key={ratingValue}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-label={`${ratingValue} ${ratingValue === 1 ? "estrella" : "estrellas"}`}
              tabIndex={isTabbable ? 0 : -1}
              onMouseEnter={() => setHoverValue(ratingValue)}
              onFocus={() => setFocusValue(ratingValue)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => onChange(ratingValue)}
              className="motion-safe:transition-transform motion-safe:hover:scale-110 rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  displayValue && ratingValue <= displayValue
                    ? "fill-primary text-primary"
                    : "fill-transparent text-muted-foreground",
                )}
              />
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="ml-2 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Limpiar
        </button>
      </div>
    </div>
  );
}

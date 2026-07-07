"use client";

import { useEffect } from "react";

import { incrementReviewView } from "../actions";

export function ViewTracker({ reviewId }: { reviewId: string }) {
  useEffect(() => {
    incrementReviewView(reviewId).catch(() => {
      // Best-effort: si falla el conteo, no afecta la lectura de la crítica.
    });
  }, [reviewId]);

  return null;
}

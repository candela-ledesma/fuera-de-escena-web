"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  created: "Crítica creada.",
  updated: "Cambios guardados.",
};

export function SavedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saved = searchParams.get("saved");

  useEffect(() => {
    if (!saved) return;

    toast.success(MESSAGES[saved] ?? "Guardado.");
    router.replace("/panel", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  created: "Entrevista creada.",
  updated: "Cambios guardados.",
};

export function InterviewSavedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const saved = searchParams.get("saved");

  useEffect(() => {
    if (!saved) return;

    toast.success(MESSAGES[saved] ?? "Guardado.");
    router.replace("/panel/entrevistas", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  return null;
}

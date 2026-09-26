"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { clearEditCopy } from "@/features/reviews/edit-copy";

import type { PanelTab } from "./panel-tabs";

const SAVED_MESSAGES: Record<PanelTab, Record<string, string>> = {
  criticas: { created: "Crítica creada.", updated: "Cambios guardados." },
  entrevistas: { created: "Entrevista creada.", updated: "Cambios guardados." },
};

/**
 * Aviso después de guardar (?saved=created|updated). Con ?saved=updated&id=
 * borra la copia local de cambios de esa crítica o entrevista: solo llega
 * acá si el servidor confirmó el guardado. Después limpia la URL.
 */
export function SavedToast({ tab, saved, id }: { tab: PanelTab; saved?: string; id?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!saved) return;

    if (saved === "updated" && id) {
      clearEditCopy(tab === "entrevistas" ? "entrevista" : "critica", id);
    }
    toast.success(SAVED_MESSAGES[tab][saved] ?? "Guardado.");
    router.replace(tab === "entrevistas" ? "/panel?tab=entrevistas" : "/panel", { scroll: false });
  }, [tab, saved, id, router]);

  return null;
}

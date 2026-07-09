import { Loader2Icon } from "lucide-react";

export default function EditReviewLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2Icon className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted">Cargando crítica…</p>
    </div>
  );
}

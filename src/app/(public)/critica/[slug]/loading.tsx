import { Loader2Icon } from "lucide-react";

export default function ReviewDetailLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
      <Loader2Icon className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted">Cargando crítica…</p>
    </div>
  );
}

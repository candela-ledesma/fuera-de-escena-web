"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Image
        src="/brand/logo.png"
        alt=""
        aria-hidden="true"
        width={72}
        height={72}
        className="size-18 rounded-full border border-border object-cover"
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Error</p>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Algo salió mal
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver a inicio.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={reset}>
          Reintentar
        </Button>
        <Button asChild>
          <Link href="/">Volver a inicio</Link>
        </Button>
      </div>
    </div>
  );
}

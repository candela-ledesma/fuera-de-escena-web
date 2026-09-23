import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Error 404</p>
        <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
          Esta página no existe
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted">
          Puede que el contenido se haya movido, borrado, o que el enlace esté mal escrito.
        </p>
      </div>

      <Button asChild>
        <Link href="/">Volver a inicio</Link>
      </Button>
    </div>
  );
}

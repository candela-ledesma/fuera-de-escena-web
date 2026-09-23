import Image from "next/image";

import { cn } from "@/lib/utils";

/** Portada 16/10. Sin imagen: fondo de la franja oscura con el logo. */
export function CoverImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[16/10] overflow-hidden rounded-[4px] bg-band", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div data-testid="cover-fallback" className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={96}
            height={96}
            className="size-16 rounded-full object-cover opacity-90 sm:size-20"
          />
        </div>
      )}
    </div>
  );
}

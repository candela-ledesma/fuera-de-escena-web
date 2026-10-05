import React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type CoverImageFit = "cover" | "contain";
type CoverImageAspect = "square" | "wide";

/**
 * Portada editorial con proporción configurable.
 * La landing usa base cuadrada con fondo redondeado para conservar el look de
 * las primeras versiones, mientras que `fit="contain"` permite casos puntuales
 * donde la imagen no debe recortarse.
 */
export function CoverImage({
  src,
  alt,
  sizes,
  priority = false,
  fit = "cover",
  aspect = "square",
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  fit?: CoverImageFit;
  aspect?: CoverImageAspect;
  className?: string;
}) {
  const aspectClassName = aspect === "wide" ? "aspect-[16/10]" : "aspect-square";
  const imageClassName = fit === "contain" ? "object-contain p-3" : "object-cover object-center";

  return (
    <div className={cn("relative overflow-hidden rounded-[12px] bg-secondary/80", aspectClassName, className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={imageClassName} />
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

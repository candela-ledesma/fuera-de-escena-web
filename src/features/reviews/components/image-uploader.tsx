"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { Star, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES } from "../schema";

export type ExistingImage = {
  storagePath: string;
  altText: string | null;
  isCover: boolean;
};

type Slot = {
  key: string;
  file: File | null;
  previewUrl: string;
  altText: string;
};

function slotsFromExisting(images: ExistingImage[]): Slot[] {
  return images.map((image) => ({
    key: image.storagePath,
    file: null,
    previewUrl: image.storagePath,
    altText: image.altText ?? "",
  }));
}

function initialCoverIndex(images: ExistingImage[]): number {
  const index = images.findIndex((image) => image.isCover);
  return index >= 0 ? index : 0;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Solo se aceptan imágenes JPG, PNG o WEBP.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Cada imagen debe pesar menos de 5MB.";
  }

  return null;
}

export function ImageUploader({ existingImages = [] }: { existingImages?: ExistingImage[] }) {
  const [slots, setSlots] = useState<Slot[]>(() => slotsFromExisting(existingImages));
  const [coverIndex, setCoverIndex] = useState(() => initialCoverIndex(existingImages));
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneId = useId();
  const coverGroupName = useId();

  useEffect(() => {
    return () => {
      slots.forEach((slot) => {
        if (slot.file) URL.revokeObjectURL(slot.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList | File[]) {
    setError(null);
    const incoming = Array.from(files);
    const availableSlots = MAX_REVIEW_IMAGES - slots.length;

    if (incoming.length > availableSlots) {
      setError(
        availableSlots <= 0
          ? `Ya tenés ${MAX_REVIEW_IMAGES} imágenes. Eliminá una para agregar otra.`
          : `Solo podés agregar ${availableSlots} imagen${availableSlots === 1 ? "" : "es"} más.`,
      );
      return;
    }

    for (const file of incoming) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    const newSlots: Slot[] = incoming.map((file) => ({
      key: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      altText: "",
    }));

    setSlots((current) => [...current, ...newSlots]);
  }

  function removeSlot(key: string) {
    setSlots((current) => {
      const removedIndex = current.findIndex((slot) => slot.key === key);
      const target = current[removedIndex];
      if (target?.file) URL.revokeObjectURL(target.previewUrl);

      setCoverIndex((currentCover) => {
        if (removedIndex < currentCover) return currentCover - 1;
        if (removedIndex === currentCover) return 0;
        return currentCover;
      });

      return current.filter((slot) => slot.key !== key);
    });
    setError(null);
  }

  function updateAltText(key: string, altText: string) {
    setSlots((current) => current.map((slot) => (slot.key === key ? { ...slot, altText } : slot)));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files.length > 0) {
      addFiles(event.dataTransfer.files);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  const canAddMore = slots.length < MAX_REVIEW_IMAGES;
  const newFiles = slots.filter((slot) => slot.file);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <Label>Imágenes (hasta {MAX_REVIEW_IMAGES})</Label>
        <span className="text-sm text-muted-foreground">
          {slots.length} / {MAX_REVIEW_IMAGES}
        </span>
      </div>

      {slots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2" role="radiogroup" aria-label="Imagen de portada">
          {slots.map((slot, index) => {
            const isCover = index === coverIndex;
            const altId = `${coverGroupName}-alt-${index}`;

            return (
              <div key={slot.key} className="grid gap-2">
                <div className="group relative aspect-square overflow-hidden rounded-md border border-border bg-secondary">
                  <Image
                    src={slot.previewUrl}
                    alt={slot.altText || `Imagen ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={Boolean(slot.file)}
                  />
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isCover}
                    onClick={() => setCoverIndex(index)}
                    className={cn(
                      "absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors",
                      isCover
                        ? "bg-primary text-primary-foreground"
                        : "border border-primary/60 bg-background/80 text-primary hover:bg-background",
                    )}
                  >
                    <Star className={cn("size-3", isCover && "fill-primary-foreground")} />
                    {isCover ? "Portada" : "Hacer portada"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.key)}
                    aria-label={`Eliminar imagen ${index + 1}`}
                    className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <Label htmlFor={altId}>Texto alternativo</Label>
                <Input
                  id={altId}
                  aria-label={`Descripción de la imagen ${index + 1} (accesibilidad)`}
                  placeholder={`Descripción de la imagen ${index + 1} (accesibilidad)`}
                  value={slot.altText}
                  onChange={(event) => updateAltText(slot.key, event.target.value)}
                />
                {slot.altText.trim() === "" ? (
                  <p className="text-xs text-muted-foreground">Falta el texto alternativo</p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {canAddMore ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Arrastrá imágenes acá o presioná Enter para elegir archivos"
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-secondary/50 px-4 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragOver && "border-primary bg-accent/40",
          )}
        >
          <p className="font-display text-base text-foreground">
            Arrastrá imágenes acá o hacé click para elegir
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG o WEBP, hasta 5MB cada una.</p>
        </div>
      ) : null}

      <input
        ref={inputRef}
        id={dropzoneId}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        data-testid="review-image-input"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {newFiles.map((slot) => (
        <FileFormInput key={slot.key} file={slot.file!} />
      ))}
      {newFiles.map((slot) => (
        <input key={`alt-${slot.key}`} type="hidden" name="imageAlts" value={slot.altText} />
      ))}
      <input type="hidden" name="coverIndex" value={coverIndex} />
    </div>
  );
}

function FileFormInput({ file }: { file: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    ref.current.files = dataTransfer.files;
  }, [file]);

  return <input ref={ref} type="file" name="images" className="hidden" readOnly />;
}

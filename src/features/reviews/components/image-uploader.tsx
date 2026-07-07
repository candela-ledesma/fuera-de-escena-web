"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_REVIEW_IMAGES } from "../schema";

export type ExistingImage = {
  storagePath: string;
  altText: string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneId = useId();

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
      const target = current.find((slot) => slot.key === key);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
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
      <Label>Imágenes (hasta {MAX_REVIEW_IMAGES})</Label>

      {slots.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map((slot, index) => (
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
                  onClick={() => removeSlot(slot.key)}
                  aria-label={`Eliminar imagen ${index + 1}`}
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <Input
                aria-label={`Descripción de la imagen ${index + 1} (accesibilidad)`}
                placeholder={`Descripción de la imagen ${index + 1} (accesibilidad)`}
                value={slot.altText}
                onChange={(event) => updateAltText(slot.key, event.target.value)}
              />
            </div>
          ))}
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

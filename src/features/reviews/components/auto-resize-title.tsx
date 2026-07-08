"use client";

import { forwardRef, useEffect, useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

function resize(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export const AutoResizeTitle = forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & { onEnter?: () => void }
>(function AutoResizeTitle({ className, onEnter, onChange, onKeyDown, ...props }, forwardedRef) {
  const innerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (innerRef.current) {
      resize(innerRef.current);
    }
  }, []);

  return (
    <textarea
      ref={(node) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      rows={1}
      className={cn(
        "block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-display !text-[2rem] font-medium break-words text-[#6E4B3A] shadow-none outline-none placeholder:text-[#6E4B3A]/35 focus-visible:ring-0 sm:!text-[2.25rem]",
        className,
      )}
      onChange={(event) => {
        resize(event.currentTarget);
        onChange?.(event);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter?.();
        }
        onKeyDown?.(event);
      }}
      {...props}
    />
  );
});

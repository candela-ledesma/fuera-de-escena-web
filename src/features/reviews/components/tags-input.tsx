"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function TagsInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => parseTags(value), [value]);

  function commitTags(nextTags: string[]) {
    onChange(nextTags.join(", "));
  }

  function addTag(rawInput: string) {
    const incoming = parseTags(rawInput).filter((tag) => !tags.includes(tag));
    if (incoming.length === 0) {
      setDraft("");
      return;
    }
    commitTags([...tags, ...incoming]);
    setDraft("");
  }

  function removeTag(tag: string) {
    commitTags(tags.filter((existing) => existing !== tag));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-field-border bg-field-background px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full border border-foreground/30 px-2 py-0.5 text-sm text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Quitar ${tag}`}
            className="rounded-full hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={tags.length === 0 ? "drama, teatro independiente, unipersonal" : ""}
        className="min-w-[10ch] flex-1 border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
      />
    </div>
  );
}

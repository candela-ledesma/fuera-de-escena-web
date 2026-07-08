"use client";

import { useEffect } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { editorExtensions } from "@/lib/editor/extensions";

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]")}
    >
      {children}
    </Button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  return (
    <div
      role="toolbar"
      aria-label="Formato de texto"
      className="flex h-11 flex-wrap items-center gap-1 rounded-t-lg border border-b-0 border-border bg-card px-2"
    >
      <ToolbarButton
        label="Negrita"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        label="Itálica"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        label="Subtítulo"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <span className="text-sm font-semibold">H2</span>
      </ToolbarButton>
      <ToolbarButton
        label="Subtítulo pequeño"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <span className="text-sm font-semibold">H3</span>
      </ToolbarButton>
      <ToolbarButton
        label="Cita"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        label="Lista"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        label="Lista numerada"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <ToolbarButton
        label="Enlace"
        active={editor.isActive("link")}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
          }

          const url = window.prompt("URL del enlace (http, https o mailto):");
          if (!url) return;

          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Deshacer"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 />
      </ToolbarButton>
      <ToolbarButton
        label="Rehacer"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 />
      </ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  content,
  onChange,
}: {
  content: unknown;
  onChange: (json: unknown, plainText: string) => void;
}) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Texto de la crítica",
        class:
          "prose-editor mx-auto max-w-[65ch] min-h-[40vh] lg:min-h-[60vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON(), editor.getText());
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-border bg-card px-6 py-8 sm:px-10">
        <div className="mx-auto min-h-[40vh] max-w-[65ch] animate-pulse lg:min-h-[60vh]" />
      </div>
    );
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <div className="rounded-b-lg border border-border bg-card px-6 py-8 sm:px-10">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

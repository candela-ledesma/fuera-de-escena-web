import { getSchema } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

import { editorExtensions } from "@/lib/editor/extensions";

const pmSchema = getSchema(editorExtensions);
const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:"];

function normalizeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;

  try {
    const url = new URL(href, "http://localhost");
    if (!ALLOWED_LINK_PROTOCOLS.includes(url.protocol)) return null;
  } catch {
    return null;
  }

  return href;
}

function extractPlainText(doc: Node): string {
  const paragraphs: string[] = [];

  doc.forEach((node) => {
    paragraphs.push(node.textContent);
  });

  return paragraphs.join("\n\n").trim();
}

export function validateAndNormalizeContent(rawJson: unknown): { doc: unknown; plainText: string } | null {
  let doc: Node;

  try {
    doc = Node.fromJSON(pmSchema, rawJson);
    doc.check();
  } catch {
    return null;
  }

  let hasInvalidLink = false;

  doc.descendants((node) => {
    node.marks.forEach((mark) => {
      if (mark.type.name !== "link") return;

      const normalized = normalizeHref(mark.attrs.href);

      if (!normalized) {
        hasInvalidLink = true;
      }
    });
  });

  if (hasInvalidLink) {
    return null;
  }

  return { doc: doc.toJSON(), plainText: extractPlainText(doc) };
}

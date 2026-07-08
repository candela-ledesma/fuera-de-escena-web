import { generateHTML } from "@tiptap/html";

import { editorExtensions } from "@/lib/editor/extensions";

export function ReviewContent({ contentJson }: { contentJson: unknown }) {
  if (!contentJson) return null;

  const html = generateHTML(contentJson as object, editorExtensions);

  return <div className="prose-editor" dangerouslySetInnerHTML={{ __html: html }} />;
}

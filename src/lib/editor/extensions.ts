import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

export const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    underline: false,
    strike: false,
  }),
  Link.configure({
    openOnClick: false,
    protocols: ["http", "https", "mailto"],
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
  }),
];

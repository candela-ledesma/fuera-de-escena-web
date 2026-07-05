import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel",
};

export default function PanelPage() {
  return (
    <div className="space-y-2">
      <h1 className="font-display text-3xl">Bienvenida</h1>
      <p className="text-sm text-muted">
        Acá va a vivir el listado de críticas y la moderación de comentarios.
      </p>
    </div>
  );
}

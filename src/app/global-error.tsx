"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#f5eae4",
          color: "#2a1f18",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#6b5449",
              marginBottom: "0.5rem",
            }}
          >
            Error
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, margin: 0 }}>Algo salió mal</h1>
          <p style={{ maxWidth: "24rem", margin: "0.5rem auto 0", fontSize: "0.875rem", color: "#6b5449" }}>
            Ocurrió un error inesperado al cargar el sitio. Probá recargar la página.
          </p>
        </div>

        <button
          onClick={reset}
          style={{
            borderRadius: "9999px",
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            background: "#c9a84c",
            color: "#fdf8f5",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}

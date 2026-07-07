import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";

import "./globals.css";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";

const bodyFont = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Fuera de Escena BB",
    template: "%s | Fuera de Escena BB",
  },
  description: "Críticas de teatro de Bahía Blanca con comentarios moderados y reacciones públicas.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
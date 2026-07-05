import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import "./globals.css";

import type { ReactNode } from "react";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
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
      <body className="min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
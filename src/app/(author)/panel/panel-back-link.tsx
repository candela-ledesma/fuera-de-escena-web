"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PanelBackLink() {
  const pathname = usePathname();
  const isReviewEditor = pathname.startsWith("/panel/criticas");

  const href = isReviewEditor ? "/panel" : "/";
  const label = isReviewEditor ? "Volver al panel" : "Volver a inicio";

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="justify-self-start px-2 text-muted hover:text-foreground sm:px-3"
    >
      <Link href={href} aria-label={label}>
        <ArrowLeft />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    </Button>
  );
}

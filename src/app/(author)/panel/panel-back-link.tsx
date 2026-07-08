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
      className="justify-self-start text-muted hover:text-foreground"
    >
      <Link href={href}>
        <ArrowLeft />
        {label}
      </Link>
    </Button>
  );
}

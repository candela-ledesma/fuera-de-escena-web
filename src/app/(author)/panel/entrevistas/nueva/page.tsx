import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/config";
import { InterviewForm } from "@/features/interviews/components/interview-form";
import { createInterview } from "@/features/interviews/actions";

export const metadata: Metadata = {
  title: "Nueva entrevista",
};

export default async function NewInterviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Nueva entrevista</h1>
      <InterviewForm action={createInterview} submitLabel="Crear entrevista" />
    </div>
  );
}

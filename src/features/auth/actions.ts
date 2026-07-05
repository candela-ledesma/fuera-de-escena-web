"use server";

import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server";

import { signInSchema } from "./schema";

export type SignInState = {
  error?: string;
};

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo.startsWith("/panel") ? redirectTo : "/panel");
}

export async function signOut(): Promise<void> {
  const supabase = await getServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

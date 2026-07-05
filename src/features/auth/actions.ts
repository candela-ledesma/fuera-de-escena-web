"use server";

import { AuthError } from "next-auth";

import { signIn as authSignIn, signOut as authSignOut } from "@/lib/auth/config";

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

  const redirectTo = formData.get("redirectTo");

  try {
    await authSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: typeof redirectTo === "string" && redirectTo.startsWith("/panel") ? redirectTo : "/panel",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." };
    }

    throw error;
  }

  return {};
}

export async function signOut(): Promise<void> {
  await authSignOut({ redirectTo: "/login" });
}

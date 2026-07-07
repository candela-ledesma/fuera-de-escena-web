import { redirect } from "next/navigation";

import { auth } from "./config";

export async function requireAuthorSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return { authorId: session.user.id };
}

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { db } from "@/lib/db/client";
import { authors } from "@/lib/db/schema";

import { signInSchema } from "@/features/auth/schema";

import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const [author] = await db
          .select()
          .from(authors)
          .where(eq(authors.email, parsed.data.email))
          .limit(1);

        if (!author) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(parsed.data.password, author.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: author.id,
          email: author.email,
          name: author.displayName,
        };
      },
    }),
  ],
});

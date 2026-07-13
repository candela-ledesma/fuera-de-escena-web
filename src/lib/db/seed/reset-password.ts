import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "../client";
import { authors } from "../schema";

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("Uso: npm run db:reset-password -- <email> <newPassword>");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  const [author] = await db
    .update(authors)
    .set({ passwordHash })
    .where(eq(authors.email, email))
    .returning({ id: authors.id, email: authors.email });

  if (!author) {
    console.error("No existe ninguna autora con ese email:", email);
    process.exit(1);
  }

  console.log("Contraseña actualizada:", author);
}

resetPassword()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

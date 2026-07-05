import bcrypt from "bcrypt";

import { db } from "../client";
import { authors } from "../schema";

async function createAuthor() {
  const email = process.argv[2];
  const password = process.argv[3];
  const displayName = process.argv[4] ?? "Autora";

  if (!email || !password) {
    console.error("Uso: npm run db:create-author -- <email> <password> [displayName]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [author] = await db
    .insert(authors)
    .values({ email, passwordHash, displayName })
    .returning({ id: authors.id, email: authors.email });

  console.log("Autora creada:", author);
}

createAuthor()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

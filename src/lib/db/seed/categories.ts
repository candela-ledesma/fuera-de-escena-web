import { db } from "../client";
import { categories } from "../schema";

const initialCategories = [
  { name: "Teatro", slug: "teatro" },
  { name: "Comedia", slug: "comedia" },
  { name: "Drama", slug: "drama" },
  { name: "Musical", slug: "musical" },
  { name: "Infantil", slug: "infantil" },
  { name: "Danza / Performance", slug: "danza-performance" },
];

async function seed() {
  await db.insert(categories).values(initialCategories).onConflictDoNothing();
  console.log("Categorías sembradas.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

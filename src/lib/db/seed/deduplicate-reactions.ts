import { sql } from "drizzle-orm";

import { db } from "../client";

async function deduplicate() {
  const result = await db.execute(sql`
    delete from reactions
    where id in (
      select id from (
        select id, row_number() over (
          partition by review_id, anon_id
          order by created_at desc
        ) as rn
        from reactions
      ) ranked
      where rn > 1
    )
  `);

  console.log(`Duplicados eliminados: ${result.rowCount ?? 0}`);
}

deduplicate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

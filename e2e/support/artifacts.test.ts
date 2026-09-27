import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RUN_ID_PATTERN, formatRunId, selectRunsToDelete } from "./artifacts";

describe("formatRunId", () => {
  it("genera un id con el formato esperado", () => {
    const id = formatRunId(new Date(2026, 8, 6, 4, 3, 2));
    assert.equal(id, "2026-09-06T04-03-02");
    assert.match(id, RUN_ID_PATTERN);
  });
});

describe("selectRunsToDelete", () => {
  const runs = Array.from({ length: 12 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}T10-00-00`);
  const current = "2026-09-26T10-00-00";

  it("deja 10 en total contando la actual y borra las más viejas", () => {
    const toDelete = selectRunsToDelete([...runs, current], current, 10);
    assert.deepEqual(toDelete, ["2026-09-03T10-00-00", "2026-09-02T10-00-00", "2026-09-01T10-00-00"]);
  });

  it("nunca borra la actual ni nombres con otro formato", () => {
    const others = ["latest", ".last-run.json", "2026-09-01", "2026-09-01T10-00-00-extra", "x2026-09-01T10-00-00"];
    const toDelete = selectRunsToDelete([...others, current, ...runs], current, 1);
    assert.equal(toDelete.includes(current), false);
    for (const name of others) assert.equal(toDelete.includes(name), false);
    assert.equal(toDelete.length, runs.length);
  });

  it("con pocas corridas no borra nada", () => {
    assert.deepEqual(selectRunsToDelete(runs.slice(0, 3), current, 10), []);
  });
});

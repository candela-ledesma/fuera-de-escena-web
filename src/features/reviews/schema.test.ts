import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { z } from "@/lib/zod";

import {
  CATEGORY_REQUIRED_MESSAGE,
  RATING_RANGE_MESSAGE,
  RATING_REQUIRED_MESSAGE,
  reviewFormSchema,
} from "./schema";

const VALID = {
  title: "Una obra",
  categoryId: "cat-1",
  rating: 4,
  contentJson: JSON.stringify({ type: "doc", content: [] }),
};

function messagesFor(field: string, value: unknown): string[] {
  const result = reviewFormSchema.safeParse({ ...VALID, [field]: value });
  return result.success ? [] : result.error.issues.filter((issue) => issue.path[0] === field).map((i) => i.message);
}

describe("Categoría", () => {
  for (const [label, value] of [
    ["undefined", undefined],
    ['"" (campo vacío del formulario)', ""],
    ["solo espacios", "   "],
  ] as const) {
    it(`${label} → "${CATEGORY_REQUIRED_MESSAGE}"`, () => {
      assert.deepEqual(messagesFor("categoryId", value), [CATEGORY_REQUIRED_MESSAGE]);
    });
  }

  it("con valor no da error", () => {
    assert.deepEqual(messagesFor("categoryId", "cat-1"), []);
  });
});

describe("Valoración", () => {
  for (const [label, value] of [
    ["undefined", undefined],
    ['"" (campo vacío del formulario; no es error de rango)', ""],
    ["null", null],
    ["texto no numérico", "abc"],
  ] as const) {
    it(`${label} → "${RATING_REQUIRED_MESSAGE}"`, () => {
      assert.deepEqual(messagesFor("rating", value), [RATING_REQUIRED_MESSAGE]);
    });
  }

  for (const value of [0, 6, "0", "6", 2.5]) {
    it(`fuera de rango (${JSON.stringify(value)}) → "${RATING_RANGE_MESSAGE}"`, () => {
      assert.deepEqual(messagesFor("rating", value), [RATING_RANGE_MESSAGE]);
    });
  }

  for (const value of [1, 5, "3"]) {
    it(`válido (${JSON.stringify(value)}) no da error`, () => {
      assert.deepEqual(messagesFor("rating", value), []);
    });
  }
});

describe("Mensajes por defecto", () => {
  it("salen en español y no dicen 'Invalid input'", () => {
    const result = z.object({ a: z.string(), b: z.number() }).safeParse({ b: "x" });
    assert.equal(result.success, false);
    for (const issue of result.error!.issues) {
      assert.doesNotMatch(issue.message, /Invalid input/);
      assert.match(issue.message, /Entrada inválida/);
    }
  });
});

import { describe, expect, test } from "bun:test";
import { createRecipeBook } from "./recipeBook";
import type { StepTimers } from "./ports";

const timers: StepTimers = { start() {}, stop() {}, subscribe: () => () => {}, snapshot: () => ({}) };

const book = createRecipeBook({
  timers,
  collection: {
    title: "Book",
    tagline: null,
    docs: [
      { name: "Zebra cake", markdown: "# Zebra cake\n\n## Ingredientes\n\n  - ovos\n" },
      { name: "02 — Sopa", markdown: "# Sopa\n\n## Ingredientes\n\n  - abóbora\n\n## Método\n\nCoza 20 minutos.\n" },
      { name: "01 — Pão", markdown: "# Pão\n\n## Ingredientes\n\n  - farinha\n" },
    ],
  },
});

describe("recipe book", () => {
  test("numbered recipes first in order, unnumbered after", () => {
    expect(book.recipes.map((r) => r.title)).toEqual(["Pão", "Sopa", "Zebra cake"]);
  });

  test("find, search and neighbours", () => {
    expect(book.find("02-sopa")?.timerCount).toBe(1);
    expect(book.search("abobora").map((r) => r.title)).toEqual(["Sopa"]);
    expect(book.search("")).toHaveLength(3);
    expect(book.neighbours("02-sopa")).toMatchObject({ previous: { title: "Pão" }, next: { title: "Zebra cake" } });
    expect(book.neighbours("01-pao").previous).toBeNull();
  });
});

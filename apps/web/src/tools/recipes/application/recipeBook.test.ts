import { describe, expect, test } from "bun:test";
import { createRecipeBook } from "./recipeBook";
import type { StepTimers } from "./ports";

const timers: StepTimers = { start() {}, stop() {}, subscribe: () => () => {}, snapshot: () => ({}) };

const pt = {
  title: "Livro",
  tagline: null,
  docs: [
    { name: "Zebra cake", markdown: "# Zebra cake\n\n## Ingredientes\n\n  - ovos\n" },
    { name: "02 — Sopa", markdown: "# Sopa\n\n## Ingredientes\n\n  - abóbora\n\n## Método\n\nCoza 20 minutos.\n" },
    { name: "01 — Pão", markdown: "# Pão\n\n## Ingredientes\n\n  - farinha\n" },
  ],
};
const it = {
  title: "Libro",
  tagline: null,
  docs: [
    { name: "02 — Zuppa", markdown: "# Zuppa\n\n## Ingredienti\n\n  - zucca\n\n## Procedimento\n\nCuoci 20 minuti.\n" },
    { name: "01 — Pane", markdown: "# Pane\n\n## Ingredienti\n\n  - farina\n" },
  ],
};
const book = createRecipeBook({ timers, collections: { pt, it, en: pt } });

describe("recipe book", () => {
  test("numbered recipes first in order, unnumbered after", () => {
    expect(book.in("pt").recipes.map((r) => r.title)).toEqual(["Pão", "Sopa", "Zebra cake"]);
  });

  test("find, search and neighbours", () => {
    const shelf = book.in("pt");
    expect(shelf.find("02")?.timerCount).toBe(1);
    expect(shelf.search("abobora").map((r) => r.title)).toEqual(["Sopa"]);
    expect(shelf.search("")).toHaveLength(3);
    expect(shelf.neighbours("02")).toMatchObject({ previous: { title: "Pão" }, next: { title: "Zebra cake" } });
    expect(shelf.neighbours("01").previous).toBeNull();
  });

  test("the same recipe id works in every language, and Italian durations count", () => {
    expect(book.in("it").find("02")).toMatchObject({ title: "Zuppa", timerCount: 1 });
    expect(book.in("it").search("zucca").map((r) => r.id)).toEqual(["02"]);
  });
});

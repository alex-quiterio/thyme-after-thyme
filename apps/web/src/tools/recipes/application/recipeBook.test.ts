import { describe, expect, test } from "bun:test";
import { createRecipeBook, emptyLibrary } from "./recipeBook";
import type { LibraryState, StepTimers } from "./ports";

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

function setup(saved: LibraryState = emptyLibrary(), savedProgress: Record<string, string[]> = {}) {
  const saves: LibraryState[] = [];
  const progressSaves: Record<string, string[]>[] = [];
  const book = createRecipeBook({
    timers,
    collections: { pt, it, en: pt },
    library: { load: () => saved, save: (s) => void saves.push(JSON.parse(JSON.stringify(s))) },
    progress: { load: () => savedProgress, save: (p) => void progressSaves.push(JSON.parse(JSON.stringify(p))) },
  });
  return { book, saves, progressSaves };
}

describe("default recipes", () => {
  const { book } = setup();

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
    expect(book.in("pt").origin("02")).toBe("default");
  });
});

describe("importing", () => {
  const toast = JSON.stringify({ number: 26, title: "Tomato toast", sections: [{ title: "Method", steps: ["Toast 3 minutes."] }] });

  test("a single recipe is for the current language but visible in all, saved, and notifies", () => {
    const { book, saves } = setup();
    let notified = 0;
    book.subscribe(() => notified++);
    const out = book.importFile("toast.json", toast, "it");
    expect(out).toEqual({ added: 1, unchanged: 0, errors: [] });
    expect(book.in("it").find("26")).toMatchObject({ title: "Tomato toast", timerCount: 1 });
    expect(book.in("it").origin("26")).toBe("imported");
    expect(book.in("pt").find("26")).toMatchObject({ title: "Tomato toast" }); // not lost when switching language
    expect(notified).toBe(1);
    expect(saves).toHaveLength(1);
  });

  test("an import replaces the default with the same id", () => {
    const { book } = setup();
    book.importFile("pao.json", JSON.stringify({ number: 1, title: "Pão novo", sections: [{ ingredients: ["x"] }] }), "pt");
    expect(book.in("pt").find("01")).toMatchObject({ title: "Pão novo" });
    expect(book.in("pt").origin("01")).toBe("imported");
    expect(book.in("it").find("01")?.title).toBe("Pane"); // existing translations are never overwritten
  });

  test("a full export goes to its languages and what's already there isn't duplicated", () => {
    const { book, saves } = setup();
    const bundle = JSON.stringify({
      format: "thyme-after-thyme/recipes",
      languages: {
        pt: { recipes: [{ number: 1, title: "Pão", sections: [{ title: "Ingredientes", ingredients: ["farinha"] }] }, JSON.parse(toast)] },
        it: { recipes: [JSON.parse(toast)] },
      },
    });
    const out = book.importFile("all.json", bundle, "en");
    expect(out).toMatchObject({ added: 2, unchanged: 1, errors: [] });
    expect(book.in("pt").origin("01")).toBe("default"); // identical to the default: not copied
    expect(book.in("pt").find("26")).toBeDefined();
    expect(book.in("it").find("26")).toBeDefined();
    expect(book.in("en").find("26")).toBeUndefined();
    expect(saves).toHaveLength(1);
  });

  test("bad files report errors and change nothing", () => {
    const { book, saves } = setup();
    const out = book.importFile("bad.json", '{"title":"x","sections":[{"step":[]}]}', "pt");
    expect(out.added).toBe(0);
    expect(out.errors[0]).toContain("unknown key");
    expect(saves).toHaveLength(0);
    expect(book.in("pt").recipes).toHaveLength(3);
  });
});

describe("removing and restoring", () => {
  test("removing a default hides it in every language; restore brings it back", () => {
    const { book } = setup();
    book.remove("02");
    expect(book.in("pt").find("02")).toBeUndefined();
    expect(book.in("it").find("02")).toBeUndefined();
    expect(book.hasRemovedDefaults()).toBe(true);
    book.restoreDefaults();
    expect(book.in("pt").find("02")).toBeDefined();
    expect(book.hasRemovedDefaults()).toBe(false);
  });

  test("removing an imported recipe deletes it; importing a removed id shows it again", () => {
    const { book } = setup();
    const toast = JSON.stringify({ number: 26, title: "Toast", sections: [{ ingredients: ["bread"] }] });
    book.importFile("t.json", toast, "pt");
    book.remove("26");
    expect(book.in("pt").find("26")).toBeUndefined();
    book.importFile("t.json", toast, "pt"); // explicit import wins over an earlier removal
    expect(book.in("pt").find("26")).toBeDefined();
  });

  test("importing a removed default restores it", () => {
    const { book } = setup();
    book.remove("01");
    const out = book.importFile("pao.json", JSON.stringify({ number: 1, title: "Pão", sections: [{ title: "Ingredientes", ingredients: ["farinha"] }] }), "pt");
    expect(out.unchanged).toBe(1);
    expect(book.in("pt").find("01")).toBeDefined();
  });

  test("damaged saved recipes are skipped, not fatal", () => {
    const saved = { ...emptyLibrary(), imported: { ...emptyLibrary().imported, pt: [{ name: "bad", json: { nope: true } }] } };
    expect(setup(saved).book.in("pt").recipes).toHaveLength(3);
  });
});

describe("cooking progress", () => {
  test("ticks are saved per recipe and come back", () => {
    const { book, progressSaves } = setup();
    book.toggleTick("02", "1-0");
    book.toggleTick("02", "1-3");
    book.toggleTick("01", "0-1");
    expect([...book.ticked("02")]).toEqual(["1-0", "1-3"]);
    expect(progressSaves.at(-1)).toEqual({ "02": ["1-0", "1-3"], "01": ["0-1"] });
    book.toggleTick("02", "1-0"); // tapping again un-ticks
    expect([...book.ticked("02")]).toEqual(["1-3"]);
    expect([...setup(undefined, { "02": ["1-3"] }).book.ticked("02")]).toEqual(["1-3"]);
  });

  test("clearing one recipe leaves the others; changes notify", () => {
    const { book, progressSaves } = setup(undefined, { "02": ["a"], "01": ["b"] });
    let notified = 0;
    book.subscribe(() => notified++);
    book.clearTicks("02");
    expect(book.ticked("02").size).toBe(0);
    expect([...book.ticked("01")]).toEqual(["b"]);
    expect(progressSaves.at(-1)).toEqual({ "01": ["b"] });
    expect(notified).toBe(1);
  });

  test("the same set comes back until something changes (needed by React)", () => {
    const { book } = setup();
    expect(book.ticked("02")).toBe(book.ticked("02"));
  });

  test("removing a recipe forgets its progress", () => {
    const { book } = setup(undefined, { "02": ["a"] });
    book.remove("02");
    expect(book.ticked("02").size).toBe(0);
  });
});

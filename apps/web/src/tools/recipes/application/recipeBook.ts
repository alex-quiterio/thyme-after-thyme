import { matchesQuery, type Recipe } from "@recipes/domain/recipe";
import { parseDocument } from "@recipes/domain/recipeDocument";
import { readImportFile } from "@recipes/domain/recipeImport";
import { locales, type Locale } from "@shared/locales";
import type { LibraryState, LibraryStorage, ProgressStorage, RawRecipe, RecipeCollection, ScaleAction, StepTimers } from "./ports";

export type RecipeBook = ReturnType<typeof createRecipeBook>;
export type RecipeShelf = ReturnType<typeof makeShelf>;
export type Origin = "default" | "imported";
export type ImportOutcome = {
  /** New or changed recipes now in the book. */
  added: number;
  /** Recipes that were already there, identical. */
  unchanged: number;
  errors: string[];
};

export const emptyLibrary = (): LibraryState => ({ imported: { en: [], pt: [], it: [] }, hidden: [] });

function makeShelf(collection: RecipeCollection, entries: Array<{ recipe: Recipe; origin: Origin }>) {
  const sorted = [...entries].sort(
    (a, b) => (a.recipe.number ?? Infinity) - (b.recipe.number ?? Infinity) || a.recipe.title.localeCompare(b.recipe.title),
  );
  const recipes = sorted.map((e) => e.recipe);
  const origins = new Map(sorted.map((e) => [e.recipe.id, e.origin]));
  return {
    title: collection.title,
    tagline: collection.tagline,
    recipes,
    find: (id: string) => recipes.find((r) => r.id === id),
    search: (query: string) => recipes.filter((r) => matchesQuery(r, query)),
    origin: (id: string): Origin => origins.get(id) ?? "default",
    neighbours(id: string): { previous: Recipe | null; next: Recipe | null } {
      const i = recipes.findIndex((r) => r.id === id);
      return { previous: recipes[i - 1] ?? null, next: recipes[i + 1] ?? null };
    },
  };
}

/**
 * The recipe book: the default recipes that ship with the app, plus whatever the user
 * imported, minus whatever they removed. The same recipe id exists in every language.
 */
export function createRecipeBook({
  collections,
  timers,
  library,
  progress,
  scaler,
}: {
  collections: Record<Locale, RecipeCollection>;
  timers: StepTimers;
  library: LibraryStorage;
  progress: ProgressStorage;
  scaler: ScaleAction;
}) {
  let state = library.load();
  let version = 0;
  const listeners = new Set<() => void>();
  const shelves = new Map<Locale, RecipeShelf>();

  let ticks = progress.load();
  const tickSets = new Map<string, ReadonlySet<string>>();
  const notify = () => {
    version++;
    listeners.forEach((l) => l());
  };
  const ticked = (id: string): ReadonlySet<string> => {
    let set = tickSets.get(id);
    if (!set) tickSets.set(id, (set = new Set(ticks[id] ?? [])));
    return set;
  };
  const setTicks = (id: string, next: Set<string>) => {
    ticks = { ...ticks };
    if (next.size > 0) ticks[id] = [...next];
    else delete ticks[id];
    tickSets.set(id, next);
    progress.save(ticks);
    notify();
  };

  const commit = (next: LibraryState) => {
    state = next;
    library.save(state);
    shelves.clear();
    notify();
  };

  const safeParse = (doc: RawRecipe): Recipe | null => {
    try {
      return parseDocument(doc);
    } catch {
      return null; // a damaged saved recipe must never take the book down
    }
  };

  function shelfFor(locale: Locale): RecipeShelf {
    const byId = new Map<string, { recipe: Recipe; origin: Origin }>();
    for (const doc of collections[locale].docs) {
      const recipe = parseDocument(doc);
      byId.set(recipe.id, { recipe, origin: "default" });
    }
    for (const doc of state.imported[locale] ?? []) {
      const recipe = safeParse(doc);
      if (recipe) byId.set(recipe.id, { recipe, origin: "imported" }); // an import replaces the default with that id
    }
    for (const id of state.hidden) byId.delete(id);
    return makeShelf(collections[locale], [...byId.values()]);
  }

  const idOf = (doc: RawRecipe) => parseDocument(doc).id;

  return {
    in(locale: Locale): RecipeShelf {
      let shelf = shelves.get(locale);
      if (!shelf) shelves.set(locale, (shelf = shelfFor(locale)));
      return shelf;
    },
    timers,
    /** Opens a recipe in the scaler. */
    scaleRecipe: (id: string) => scaler.open(id),

    /** Changes whenever the library does (for useSyncExternalStore). */
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    version: () => version,

    /** True when some default recipes were removed and can be brought back. */
    hasRemovedDefaults: () => state.hidden.length > 0,

    /**
     * Adds the recipes in a picked file. A file that doesn't name a language (a single recipe)
     * goes into `currentLocale`. Valid recipes are kept even if others in the file are not.
     */
    importFile(fileName: string, text: string, currentLocale: Locale): ImportOutcome {
      const read = readImportFile(fileName, text);
      const imported = Object.fromEntries(locales.map((l) => [l, [...(state.imported[l] ?? [])]])) as LibraryState["imported"];
      const touched = new Set<string>();
      let added = 0;
      let unchanged = 0;

      for (const { locale, doc } of read.docs) {
        const recipe = parseDocument(doc);
        const id = recipe.id;
        // A file that names a language goes there. One that doesn't (a single recipe) is for the language
        // you're reading in, and also shows up in the others so it isn't lost when you switch,
        // but never over a recipe that already has a translation there.
        const targets: Array<{ lang: Locale; override: boolean }> = locale
          ? [{ lang: locale, override: true }]
          : [{ lang: currentLocale, override: true }, ...locales.filter((l) => l !== currentLocale).map((lang) => ({ lang, override: false }))];

        let changed = false;
        for (const { lang, override } of targets) {
          const sameAsDefault = collections[lang].docs.some((d) => idOf(d) === id && JSON.stringify(parseDocument(d)) === JSON.stringify(recipe));
          const existing = imported[lang].findIndex((d) => safeParse(d)?.id === id);
          const defaultExists = collections[lang].docs.some((d) => idOf(d) === id);

          if (sameAsDefault && existing === -1) continue; // already there, identical
          if (!override && (existing >= 0 || defaultExists)) continue; // keep the translation that's there
          if (existing >= 0) imported[lang][existing] = doc;
          else imported[lang].push(doc);
          changed = true;
        }

        if (changed) added++;
        else unchanged++;
        if (changed || state.hidden.includes(id)) touched.add(id); // importing a removed recipe brings it back
      }

      if (touched.size > 0) commit({ imported, hidden: state.hidden.filter((id) => !touched.has(id)) });
      return { added, unchanged, errors: read.errors };
    },

    /** Removes a recipe from the book, in every language. Defaults can be restored later. */
    /** Ticked ingredient and step keys for a recipe. */
    ticked,
    toggleTick(id: string, key: string) {
      const next = new Set(ticked(id));
      if (!next.delete(key)) next.add(key);
      setTicks(id, next);
    },
    clearTicks: (id: string) => setTicks(id, new Set()),

    remove(id: string) {
      if (ticks[id]) {
        ticks = { ...ticks };
        delete ticks[id];
        tickSets.delete(id);
        progress.save(ticks);
      }
      const imported = Object.fromEntries(
        locales.map((l) => [l, (state.imported[l] ?? []).filter((d) => safeParse(d)?.id !== id)]),
      ) as LibraryState["imported"];
      commit({ imported, hidden: state.hidden.includes(id) ? state.hidden : [...state.hidden, id] });
    },

    /** Brings back every removed default recipe (imported recipes stay). */
    restoreDefaults() {
      commit({ ...state, hidden: [] });
    },
  };
}

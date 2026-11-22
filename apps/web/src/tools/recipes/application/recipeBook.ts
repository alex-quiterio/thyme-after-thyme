import { matchesQuery, parseRecipe, type Recipe } from "@recipes/domain/recipe";
import type { Locale } from "@shared/locales";
import type { RecipeCollection, StepTimers } from "./ports";

export type RecipeBook = ReturnType<typeof createRecipeBook>;
export type RecipeShelf = ReturnType<typeof shelfFor>;

function shelfFor(collection: RecipeCollection) {
  const recipes: Recipe[] = collection.docs
    .map((d) => parseRecipe(d.name, d.markdown))
    .sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.title.localeCompare(b.title));

  return {
    title: collection.title,
    tagline: collection.tagline,
    recipes,
    find: (id: string) => recipes.find((r) => r.id === id),
    search: (query: string) => recipes.filter((r) => matchesQuery(r, query)),
    neighbours(id: string): { previous: Recipe | null; next: Recipe | null } {
      const i = recipes.findIndex((r) => r.id === id);
      return { previous: recipes[i - 1] ?? null, next: recipes[i + 1] ?? null };
    },
  };
}

/** The same book in several languages. Recipes share ids across languages. */
export function createRecipeBook({
  collections,
  timers,
}: {
  collections: Record<Locale, RecipeCollection>;
  timers: StepTimers;
}) {
  const shelves = new Map<Locale, RecipeShelf>();
  return {
    in(locale: Locale): RecipeShelf {
      let shelf = shelves.get(locale);
      if (!shelf) shelves.set(locale, (shelf = shelfFor(collections[locale])));
      return shelf;
    },
    timers,
  };
}

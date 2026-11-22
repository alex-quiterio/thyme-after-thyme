import { matchesQuery, parseRecipe, type Recipe } from "@recipes/domain/recipe";
import type { RecipeCollection, StepTimers } from "./ports";

export type RecipeBook = ReturnType<typeof createRecipeBook>;

export function createRecipeBook({ collection, timers }: { collection: RecipeCollection; timers: StepTimers }) {
  const recipes: Recipe[] = collection.docs
    .map((d) => parseRecipe(d.name, d.markdown))
    .sort((a, b) => (a.number ?? Infinity) - (b.number ?? Infinity) || a.title.localeCompare(b.title));

  const find = (id: string) => recipes.find((r) => r.id === id);

  return {
    title: collection.title,
    tagline: collection.tagline,
    recipes,
    find,
    search: (query: string) => recipes.filter((r) => matchesQuery(r, query)),
    neighbours(id: string): { previous: Recipe | null; next: Recipe | null } {
      const i = recipes.findIndex((r) => r.id === id);
      return { previous: recipes[i - 1] ?? null, next: recipes[i + 1] ?? null };
    },
    timers,
  };
}

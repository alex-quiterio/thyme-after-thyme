// Glue: the recipe book, as the scaler sees it. Only recipes with enough quantities are offered.
import { parseIngredientLines } from "@shared/ingredientLine";
import type { RecipeCatalog } from "@scaler/application/ports";
import type { RecipeBook } from "@recipes/application/recipeBook";

export function createScalerCatalog(book: RecipeBook): RecipeCatalog {
  return {
    list: (locale) =>
      book
        .in(locale)
        .recipes.filter((r) => r.scalable)
        .map((r) => ({ id: r.id, title: r.title, measured: parseIngredientLines(r.ingredients).filter((l) => l.kind === "measured").length })),
    get(id, locale) {
      const recipe = book.in(locale).find(id);
      return recipe ? { id, title: recipe.title, lines: recipe.ingredients } : null;
    },
  };
}

import { useEffect } from "react";
import type { RecipeBook } from "@recipes/application/recipeBook";
import { useLocale } from "@shared/useLocale";
import { RecipeList } from "./RecipeList";
import { RecipeView } from "./RecipeView";
import { useRecipeRoute } from "./useRecipeRoute";

export function RecipesTool({ book }: { book: RecipeBook }) {
  const id = useRecipeRoute();
  const shelf = book.in(useLocale());
  const recipe = id ? shelf.find(id) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return recipe ? <RecipeView key={recipe.id} book={book} shelf={shelf} recipe={recipe} /> : <RecipeList shelf={shelf} />;
}

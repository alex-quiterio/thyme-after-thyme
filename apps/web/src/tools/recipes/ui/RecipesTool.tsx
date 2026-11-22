import { useEffect } from "react";
import type { RecipeBook } from "@recipes/application/recipeBook";
import { RecipeList } from "./RecipeList";
import { RecipeView } from "./RecipeView";
import { useRecipeRoute } from "./useRecipeRoute";

export function RecipesTool({ book }: { book: RecipeBook }) {
  const id = useRecipeRoute();
  const recipe = id ? book.find(id) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return recipe ? <RecipeView key={recipe.id} book={book} recipe={recipe} /> : <RecipeList book={book} />;
}

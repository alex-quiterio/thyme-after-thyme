import { useEffect, useSyncExternalStore } from "react";
import type { RecipeBook } from "@recipes/application/recipeBook";
import { setDetailTitle } from "@shared/pageTitle";
import { useLocale } from "@shared/useLocale";
import { savedListScroll } from "./listScroll";
import { RecipeList } from "./RecipeList";
import { RecipeView } from "./RecipeView";
import { useRecipeRoute } from "./useRecipeRoute";

export function RecipesTool({ book }: { book: RecipeBook }) {
  const id = useRecipeRoute();
  useSyncExternalStore(book.subscribe, book.version); // re-render when recipes or ticks change
  const shelf = book.in(useLocale());
  const recipe = id ? shelf.find(id) : undefined;

  // a recipe opens at its top; going back to the list returns to where you were
  useEffect(() => {
    window.scrollTo(0, id ? 0 : savedListScroll());
  }, [id]);

  useEffect(() => {
    setDetailTitle(recipe?.title ?? null);
    return () => setDetailTitle(null);
  }, [recipe?.title]);

  return recipe ? <RecipeView key={recipe.id} book={book} shelf={shelf} recipe={recipe} /> : <RecipeList book={book} shelf={shelf} />;
}

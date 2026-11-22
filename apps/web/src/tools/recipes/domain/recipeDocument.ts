import { parseRecipe, type Recipe } from "./recipe";
import { parseRecipeJson } from "./recipeJson";

/** A recipe file as read from disk: markdown text, or already-parsed JSON. */
export type RawDocument = { name: string; markdown: string } | { name: string; json: unknown };

export function parseDocument(doc: RawDocument): Recipe {
  return "json" in doc ? parseRecipeJson(doc.name, doc.json) : parseRecipe(doc.name, doc.markdown);
}

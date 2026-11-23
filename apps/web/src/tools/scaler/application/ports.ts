import type { ScalerState } from "./scalerStore";

import type { Locale } from "@shared/locales";
import type { CatalogRecipe } from "@scaler/domain/recipeScaling";

/** A recipe that can be picked for scaling. */
export type CatalogEntry = { id: string; title: string; /** how many ingredient lines have a quantity */ measured: number };

/** The recipe book, as far as the scaler is concerned. Wired up outside both tools. */
export type RecipeCatalog = {
  /** Recipes with enough quantities to scale, in the given language. */
  list(locale: Locale): CatalogEntry[];
  get(id: string, locale: Locale): CatalogRecipe | null;
};

export type RecipeStorage = {
  load(): ScalerState | null;
  save(state: ScalerState): void;
};

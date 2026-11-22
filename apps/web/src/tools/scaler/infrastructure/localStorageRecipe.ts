import type { RecipeStorage } from "@scaler/application/ports";
import type { ScalerState } from "@scaler/application/scalerStore";

const KEY = "thyme-after-thyme.scaler.v1";

export function createLocalStorageRecipe(): RecipeStorage {
  return {
    load() {
      try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ScalerState | null;
        return parsed && Array.isArray(parsed.ingredients) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(state) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        // storage full or blocked: the recipe just won't persist
      }
    },
  };
}

import type { RecipeStorage } from "@scaler/application/ports";
import type { ScalerState } from "@scaler/application/scalerStore";

// "v2": the saved shape changed, and anything saved by an older version is simply left behind.
const KEY = "thyme-after-thyme.scaler.v2";

const isState = (s: unknown): s is ScalerState =>
  typeof s === "object" && s !== null && Array.isArray((s as ScalerState).ingredients) && Array.isArray((s as ScalerState).picked);

export function createLocalStorageRecipe(): RecipeStorage {
  return {
    load() {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
        return isState(parsed) ? parsed : null;
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

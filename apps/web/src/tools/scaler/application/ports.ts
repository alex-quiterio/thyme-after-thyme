import type { ScalerState } from "./scalerStore";

export type RecipeStorage = {
  load(): ScalerState | null;
  save(state: ScalerState): void;
};

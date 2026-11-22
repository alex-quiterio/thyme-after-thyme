import type { Ingredient, Unit } from "@scaler/domain/scaling";
import type { RecipeStorage } from "./ports";

export type ScalerState = {
  ingredients: Ingredient[];
  anchorId: string | null;
  target: string;
};

export type ScalerStore = ReturnType<typeof createScalerStore>;

export type Ports = { storage: RecipeStorage; newId: () => string };

const starter = (newId: () => string): ScalerState => ({
  ingredients: [
    { id: newId(), name: "Flour", amount: "200", unit: "g" },
    { id: newId(), name: "Butter", amount: "100", unit: "g" },
    { id: newId(), name: "Water/Milk", amount: "70", unit: "ml" },
  ],
  anchorId: null,
  target: "",
});

/** Use cases for editing a recipe and picking what to scale by. */
export function createScalerStore({ storage, newId }: Ports) {
  let state: ScalerState = storage.load() ?? starter(newId);
  const listeners = new Set<() => void>();

  const commit = (next: ScalerState) => {
    state = next;
    storage.save(state);
    listeners.forEach((l) => l());
  };

  const getState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };

  return {
    getState,
    subscribe,
    addIngredient: () =>
      commit({ ...state, ingredients: [...state.ingredients, { id: newId(), name: "", amount: "", unit: "g" as Unit }] }),
    updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) =>
      commit({ ...state, ingredients: state.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
    removeIngredient: (id: string) =>
      commit({
        ...state,
        ingredients: state.ingredients.filter((i) => i.id !== id),
        anchorId: state.anchorId === id ? null : state.anchorId,
      }),
    setAnchor: (anchorId: string | null) => commit({ ...state, anchorId }),
    setTarget: (target: string) => commit({ ...state, target }),
  };
}

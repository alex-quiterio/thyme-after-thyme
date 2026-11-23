import type { Ingredient, Unit } from "@scaler/domain/scaling";
import type { RecipeCatalog, RecipeStorage } from "./ports";

/** A recipe picked from the book, with the multiplier as typed ("2", "1/2", "" for ×1). */
export type PickedRecipe = { id: string; factor: string };

export type ScalerState = {
  ingredients: Ingredient[];
  anchorId: string | null;
  target: string;
  picked: PickedRecipe[];
};

export type ScalerStore = ReturnType<typeof createScalerStore>;

export type Ports = { storage: RecipeStorage; newId: () => string; catalog: RecipeCatalog };

const starter = (newId: () => string): ScalerState => ({
  ingredients: [
    { id: newId(), name: "Flour", amount: "200", unit: "g" },
    { id: newId(), name: "Butter", amount: "100", unit: "g" },
    { id: newId(), name: "Water/Milk", amount: "70", unit: "ml" },
  ],
  anchorId: null,
  target: "",
  picked: [],
});

/** Use cases for editing a recipe and picking what to scale by. */
export function createScalerStore({ storage, newId, catalog }: Ports) {
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

    /** The book's recipes that can be scaled. */
    catalog,
    /** Adds a recipe from the book (once). */
    pickRecipe: (id: string) => {
      if (!state.picked.some((p) => p.id === id)) commit({ ...state, picked: [...state.picked, { id, factor: "" }] });
    },
    unpickRecipe: (id: string) => commit({ ...state, picked: state.picked.filter((p) => p.id !== id) }),
    setFactor: (id: string, factor: string) =>
      commit({ ...state, picked: state.picked.map((p) => (p.id === id ? { ...p, factor } : p)) }),
    clearPicked: () => commit({ ...state, picked: [] }),
  };
}

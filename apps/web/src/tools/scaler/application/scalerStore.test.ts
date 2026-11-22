import { describe, expect, test } from "bun:test";
import { createScalerStore, type ScalerState } from "./scalerStore";

function setup(saved: ScalerState | null = null) {
  let n = 0;
  const saves: ScalerState[] = [];
  const store = createScalerStore({
    storage: { load: () => saved, save: (s) => void saves.push(s) },
    newId: () => `i${++n}`,
  });
  return { store, saves };
}

describe("scaler store", () => {
  test("starts with a starter recipe when nothing is saved", () => {
    expect(setup().store.getState().ingredients.map((i) => i.name)).toEqual(["Flour", "Butter", "Water/Milk"]);
  });

  test("loads a saved recipe", () => {
    const saved: ScalerState = { ingredients: [{ id: "x", name: "Rice", amount: "1", unit: "cup" }], anchorId: "x", target: "2" };
    expect(setup(saved).store.getState()).toEqual(saved);
  });

  test("removing the anchor clears it, and every change is saved", () => {
    const { store, saves } = setup();
    const [first] = store.getState().ingredients;
    store.setAnchor(first!.id);
    store.removeIngredient(first!.id);
    expect(store.getState().anchorId).toBeNull();
    expect(saves).toHaveLength(2);
  });

  test("edits and adds ingredients", () => {
    const { store } = setup();
    store.addIngredient();
    const added = store.getState().ingredients.at(-1)!;
    store.updateIngredient(added.id, { name: "Salt", unit: "tsp" });
    expect(store.getState().ingredients.at(-1)).toMatchObject({ name: "Salt", unit: "tsp" });
  });
});

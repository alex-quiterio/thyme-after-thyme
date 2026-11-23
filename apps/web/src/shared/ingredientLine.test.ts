import { describe, expect, test } from "bun:test";
import { isScalable, parseIngredientLine } from "./ingredientLine";

const m = (s: string) => {
  const l = parseIngredientLine(s);
  return l.kind === "measured" ? { name: l.name, unit: l.unit, min: l.min, max: l.max } : null;
};

describe("measured lines", () => {
  test("Portuguese", () => {
    expect(m("300 g de arroz")).toEqual({ name: "arroz", unit: "g", min: 300, max: null });
    expect(m("2 c. de sopa de amido de milho (maisena)")).toEqual({ name: "amido de milho (maisena)", unit: "tbsp", min: 2, max: null });
    expect(m("1/2 c. de chá de cominhos")).toEqual({ name: "cominhos", unit: "tsp", min: 0.5, max: null });
    expect(m("1 litro de leite ou bebida vegetal sem açúcar")).toMatchObject({ unit: "L", min: 1 });
    expect(m("1,5 chávenas de farinha")).toEqual({ name: "farinha", unit: "cup", min: 1.5, max: null });
    expect(m("3–4 c. de sopa de farinha")).toEqual({ name: "farinha", unit: "tbsp", min: 3, max: 4 });
    expect(m("2 dentes de alho")).toEqual({ name: "dentes de alho", unit: "pcs", min: 2, max: null });
    expect(m("3 ovos")).toEqual({ name: "ovos", unit: "pcs", min: 3, max: null });
    expect(m("1 pitada de sal")).toMatchObject({ unit: "pcs", name: "pitada de sal" });
  });

  test("English", () => {
    expect(m("2 ½ teaspoons baking powder")).toEqual({ name: "baking powder", unit: "tsp", min: 2.5, max: null });
    expect(m("2 cups (about 250 g) flour")).toEqual({ name: "flour", unit: "cup", min: 2, max: null }); // the contradicting "(about 250 g)" is dropped
    expect(m("⅓ cup (about 75 g) cold vegan margarine or butter")).toMatchObject({ unit: "cup", min: 1 / 3, name: "cold vegan margarine or butter" });
    expect(m("2 tbsp cornstarch")).toEqual({ name: "cornstarch", unit: "tbsp", min: 2, max: null });
    expect(m("250 g oyster mushrooms")).toMatchObject({ unit: "g", name: "oyster mushrooms" });
    expect(m("1 tin chickpeas")).toMatchObject({ unit: "pcs", name: "tin chickpeas" });
  });

  test("Italian", () => {
    expect(m("2 cucchiai di amido di mais (maizena)")).toMatchObject({ unit: "tbsp", min: 2, name: "amido di mais (maizena)" });
    expect(m("1 cucchiaino di sale")).toEqual({ name: "sale", unit: "tsp", min: 1, max: null });
    expect(m("1,5 tazze di farina")).toEqual({ name: "farina", unit: "cup", min: 1.5, max: null });
    expect(m("100 ml di olio d'oliva")).toEqual({ name: "olio d'oliva", unit: "ml", min: 100, max: null });
    expect(m("4–6 uova")).toEqual({ name: "uova", unit: "pcs", min: 4, max: 6 });
  });

  test("a gram sign is not the start of a word", () => {
    expect(m("4 cm de gengibre fresco")).toMatchObject({ unit: "pcs", name: "cm de gengibre fresco" });
    expect(m("2 gengibres")).toMatchObject({ unit: "pcs", name: "gengibres" });
  });
});

describe("lines that can't be scaled", () => {
  test("no leading quantity", () => {
    for (const s of ["sal", "azeite", "to taste", "Cooked beans, drained", "A couple of potatoes", "q.b."])
      expect(parseIngredientLine(s).kind).toBe("loose");
  });

  test("quantity with nothing after it, or nonsense", () => {
    expect(parseIngredientLine("200").kind).toBe("loose");
    expect(parseIngredientLine("0 g de sal").kind).toBe("loose");
    expect(parseIngredientLine("5–3 g de sal").kind).toBe("loose");
  });
});

test("a recipe is scalable when at least two lines have quantities", () => {
  expect(isScalable(["300 g de arroz", "2 ovos", "sal"])).toBe(true);
  expect(isScalable(["300 g de arroz", "sal", "pimenta"])).toBe(false);
  expect(isScalable([])).toBe(false);
});

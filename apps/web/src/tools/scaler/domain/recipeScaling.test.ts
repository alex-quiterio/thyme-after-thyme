import { describe, expect, test } from "bun:test";
import { combine, factorForAnchor, measuredLines, readFactor, scaleRecipe, type CatalogRecipe } from "./recipeScaling";

const cake: CatalogRecipe = { id: "07", title: "Cake", lines: ["200 g de farinha", "3 ovos", "3–4 c. de sopa de açúcar", "sal", "1 pitada de canela"] };
const bread: CatalogRecipe = { id: "01", title: "Bread", lines: ["500 g de farinha", "1 c. de chá de sal", "água"] };

describe("scaleRecipe", () => {
  test("every measured line scales, loose lines stay", () => {
    const r = scaleRecipe(cake, "2");
    expect(r.lines).toEqual([
      { name: "farinha", unit: "g", min: 400, max: null },
      { name: "ovos", unit: "pcs", min: 6, max: null },
      { name: "açúcar", unit: "tbsp", min: 6, max: 8 },
      { name: "pitada de canela", unit: "pcs", min: 2, max: null },
    ]);
    expect(r.loose).toEqual(["sal"]);
  });

  test("factors can be fractions and decimal commas; blank means one; junk is flagged", () => {
    expect(readFactor("1/2")).toEqual({ factor: 0.5, valid: true });
    expect(readFactor("1,5")).toEqual({ factor: 1.5, valid: true });
    expect(readFactor("")).toEqual({ factor: 1, valid: true });
    expect(readFactor("abc")).toEqual({ factor: 1, valid: false });
    expect(readFactor("0")).toEqual({ factor: 1, valid: false });
    expect(scaleRecipe(cake, "abc").lines[0]?.min).toBe(200);
  });
});

test("'I have 300 g of flour' finds the factor", () => {
  expect(factorForAnchor(cake, 0, "300")).toBe(1.5);
  expect(factorForAnchor(cake, 0, "")).toBeNull();
  expect(factorForAnchor(cake, 9, "5")).toBeNull();
  expect(measuredLines(cake)).toHaveLength(4);
});

describe("combine", () => {
  test("adds the same ingredient in the same unit across recipes", () => {
    const total = combine([scaleRecipe(cake, "1"), scaleRecipe(bread, "2")]);
    expect(total.find((l) => l.name === "farinha")).toEqual({ name: "farinha", unit: "g", min: 1200, max: null });
    expect(total.map((l) => l.name)).toEqual(["açúcar", "farinha", "ovos", "pitada de canela", "sal"]);
  });

  test("accents and case don't split an ingredient; different units stay apart; ranges add up", () => {
    const a = { id: "a", title: "A", lines: ["2 c. de sopa de Açúcar", "100 g de mel"] };
    const b = { id: "b", title: "B", lines: ["3–4 c. de sopa de acucar", "1 chávena de mel"] };
    const total = combine([scaleRecipe(a, "1"), scaleRecipe(b, "1")]);
    expect(total.find((l) => l.name.toLowerCase().startsWith("a") && l.unit === "tbsp")).toMatchObject({ min: 5, max: 6 });
    expect(total.filter((l) => l.name === "mel")).toHaveLength(2); // g and cup
  });
});

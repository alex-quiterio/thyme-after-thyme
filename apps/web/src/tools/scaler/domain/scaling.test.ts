import { describe, expect, test } from "bun:test";
import { formatAmount, parseAmount, scale, type Ingredient } from "./scaling";

const recipe: Ingredient[] = [
  { id: "f", name: "Flour", amount: "200", unit: "g" },
  { id: "b", name: "Butter", amount: "100", unit: "g" },
  { id: "w", name: "Water", amount: "70", unit: "ml" },
  { id: "s", name: "Salt", amount: "", unit: "tsp" },
];

describe("parseAmount", () => {
  test("numbers, commas and fractions", () => {
    expect(parseAmount("200")).toBe(200);
    expect(parseAmount("1,5")).toBe(1.5);
    expect(parseAmount("1/2")).toBe(0.5);
    expect(parseAmount("1 1/2")).toBe(1.5);
  });
  test("rejects junk", () => {
    for (const bad of ["", "  ", "abc", "-3", "1/0", "1 1/0"]) expect(parseAmount(bad)).toBeNull();
  });
});

describe("scale", () => {
  test("scales every ingredient by the anchor's factor", () => {
    const r = scale(recipe, "b", "150")!;
    expect(r.factor).toBe(1.5);
    expect(r.items.map((i) => i.scaled)).toEqual([300, 150, 105, null]);
  });
  test("not ready until anchor and target are usable", () => {
    expect(scale(recipe, null, "10")).toBeNull();
    expect(scale(recipe, "f", "")).toBeNull();
    expect(scale(recipe, "f", "0")).toBeNull();
    expect(scale(recipe, "s", "10")).toBeNull(); // anchor amount blank
  });
});

test("formatAmount", () => {
  expect(formatAmount(333.333)).toBe("333");
  expect(formatAmount(12.5)).toBe("12.5");
  expect(formatAmount(0.6667)).toBe("0.67");
  expect(formatAmount(2)).toBe("2");
});

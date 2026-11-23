import { parseIngredientLine, type IngredientLine } from "@shared/ingredientLine";
import { fold } from "@shared/text";
import type { Unit } from "@shared/units";
import { parseAmount } from "./scaling";

/** A recipe as the scaler sees it: a title and its ingredient lines. */
export type CatalogRecipe = { id: string; title: string; lines: string[] };

export type ScaledLine = { name: string; unit: Unit; min: number; max: number | null };
export type ScaledRecipe = {
  id: string;
  title: string;
  factor: number;
  /** False when the typed factor couldn't be read; the recipe is then shown unscaled (×1). */
  factorValid: boolean;
  lines: ScaledLine[];
  /** Ingredients with no quantity ("sal", "to taste") that stay as they are. */
  loose: string[];
};

type Measured = Extract<IngredientLine, { kind: "measured" }>;
export const measuredLines = (recipe: CatalogRecipe): Measured[] =>
  recipe.lines.map(parseIngredientLine).filter((l): l is Measured => l.kind === "measured");

/** "" means ×1; "2", "1/2" and "1,5" are fine; anything else is invalid. */
export function readFactor(text: string): { factor: number; valid: boolean } {
  if (!text.trim()) return { factor: 1, valid: true };
  const n = parseAmount(text);
  return n !== null && n > 0 ? { factor: n, valid: true } : { factor: 1, valid: false };
}

export function scaleRecipe(recipe: CatalogRecipe, factorText: string): ScaledRecipe {
  const { factor, valid } = readFactor(factorText);
  const parsed = recipe.lines.map(parseIngredientLine);
  return {
    id: recipe.id,
    title: recipe.title,
    factor,
    factorValid: valid,
    lines: parsed
      .filter((l): l is Measured => l.kind === "measured")
      .map((l) => ({ name: l.name, unit: l.unit, min: l.min * factor, max: l.max === null ? null : l.max * factor })),
    loose: parsed.filter((l) => l.kind === "loose").map((l) => l.text),
  };
}

/** "I have 300 g of this": the factor that makes the n-th measured line that amount. */
export function factorForAnchor(recipe: CatalogRecipe, lineIndex: number, have: string): number | null {
  const line = measuredLines(recipe)[lineIndex];
  const amount = parseAmount(have);
  if (!line || amount === null || amount <= 0) return null;
  return amount / line.min;
}

/** All the picked recipes together: the same ingredient in the same unit is added up. */
export function combine(recipes: ScaledRecipe[]): ScaledLine[] {
  const totals = new Map<string, ScaledLine & { hasRange: boolean }>();
  for (const r of recipes) {
    for (const l of r.lines) {
      const key = `${fold(l.name)}|${l.unit}`;
      const have = totals.get(key);
      const upper = l.max ?? l.min;
      if (have) {
        have.min += l.min;
        have.max = (have.max ?? have.min - l.min) + upper; // keep the upper bound in step with the lower one
        have.hasRange ||= l.max !== null;
      } else {
        totals.set(key, { name: l.name, unit: l.unit, min: l.min, max: upper, hasRange: l.max !== null });
      }
    }
  }
  return [...totals.values()]
    .map(({ hasRange, ...l }) => ({ ...l, max: hasRange ? l.max : null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

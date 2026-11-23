export { units, type Unit } from "@shared/units";
import type { Unit } from "@shared/units";

/** `amount` is the raw text the cook typed, so "1/2" and "1,5" survive editing. */
export type Ingredient = { id: string; name: string; amount: string; unit: Unit };

export type ScaledItem = Ingredient & { scaled: number | null };
export type Scaling = { factor: number; items: ScaledItem[] };

/** Accepts "200", "1.5", "1,5", "1/2" and "1 1/2". Returns null for anything else. */
export function parseAmount(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!s) return null;
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  let value: number;
  if (mixed) {
    if (Number(mixed[3]) === 0) return null;
    value = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  } else if (frac) {
    if (Number(frac[2]) === 0) return null;
    value = Number(frac[1]) / Number(frac[2]);
  } else {
    value = Number(s);
  }
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * "I have `target` of the anchor ingredient": scales every ingredient by the same factor.
 * Returns null until the anchor and target are both usable (positive numbers).
 */
export function scale(ingredients: Ingredient[], anchorId: string | null, target: string): Scaling | null {
  const anchor = ingredients.find((i) => i.id === anchorId);
  if (!anchor) return null;
  const base = parseAmount(anchor.amount);
  const wanted = parseAmount(target);
  if (base === null || base <= 0 || wanted === null || wanted <= 0) return null;

  const factor = wanted / base;
  const items = ingredients.map((ing) => {
    const amount = parseAmount(ing.amount);
    return { ...ing, scaled: ing.id === anchor.id ? wanted : amount === null ? null : amount * factor };
  });
  return { factor, items };
}

/** Kitchen-friendly rounding: 333 g, 12.5 ml, 0.67 cup. */
export function formatAmount(n: number): string {
  const digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
  return String(Number(n.toFixed(digits)));
}

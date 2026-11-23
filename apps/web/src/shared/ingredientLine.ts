import { fold } from "./text";
import type { Unit } from "./units";

/**
 * One line of an ingredient list, understood well enough to scale:
 *   "300 g de arroz", "2 c. de sopa de azeite", "1 ½ cups flour", "3–4 tbsp sugar", "2 dentes de alho"
 * Lines without a leading quantity ("sal", "to taste", "Cooked beans, drained") can't be scaled.
 */
export type IngredientLine =
  | { kind: "measured"; name: string; unit: Unit; min: number; max: number | null; text: string }
  | { kind: "loose"; text: string };

const VULGAR: Record<string, string> = { "½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅓": " 1/3", "⅔": " 2/3", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8" };

const NUMBER = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`;
const LEADING = new RegExp(`^(${NUMBER})(?:\\s*[–-]\\s*(${NUMBER}))?(?![\\d/])\\s*(.*)$`);

function toNumber(text: string): number {
  const t = text.trim().replace(",", ".");
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return Number(t);
}

// Unit words in Portuguese, English and Italian, matched on accent-free lowercase text.
// Order matters: teaspoons before tablespoons ("cucchiaini" starts like "cucchiai").
const UNIT_WORDS: Array<[RegExp, Unit]> = [
  [/^(kg|kilos?|quilos?)\b/, "kg"],
  [/^(ml|millilit\w*)\b/, "ml"],
  [/^(g|gr|gramas?|grams?|grammi)\b/, "g"],
  [/^(l|lt|litros?|litres?|liters?|litri)\b/, "L"],
  [/^(chavenas?|cups?|tazze?|xicaras?)\b/, "cup"],
  [/^(c\.? de cha|colheres? de cha|tsp|teaspoons?|cucchiaini|cucchiaino)\b/, "tsp"],
  [/^(c\.? de sopa|colheres? de sopa|tbsp|tablespoons?|cucchiai|cucchiaio)\b/, "tbsp"],
];

export function parseIngredientLine(raw: string): IngredientLine {
  const text = raw.trim();
  const normalized = text.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (m) => VULGAR[m] ?? m).replace(/\s+/g, " ").trim();
  const lead = normalized.match(LEADING);
  if (!lead) return { kind: "loose", text };

  const min = toNumber(lead[1]!);
  const max = lead[2] ? toNumber(lead[2]) : null;
  if (!(min > 0) || (max !== null && !(max >= min))) return { kind: "loose", text };

  let rest = lead[3]!;
  let unit: Unit = "pcs";
  const folded = fold(rest);
  for (const [pattern, u] of UNIT_WORDS) {
    const m = folded.match(pattern);
    if (m) {
      unit = u;
      rest = rest.slice(m[0].length); // folding keeps the length, so the same offset works on the original
      break;
    }
  }

  const name = rest
    .replace(/^\.?\s*/, "")
    .replace(/^(?:(?:de|di|of)\s+|d')/i, "") // "g de arroz", "g di riso", "cup of flour", but not the "de" in "dentes"
    .replace(/\s*\([^)]*\d[^)]*\)\s*/g, " ") // "(about 250 g)" would contradict the scaled number
    .replace(/\s+/g, " ")
    .replace(/[\s,;]+$/, "")
    .trim();
  if (!name || /\d/.test(name)) return { kind: "loose", text }; // "3 apples or 2 large": a second number we can't scale
  return { kind: "measured", name, unit, min, max, text };
}

export const parseIngredientLines = (lines: string[]): IngredientLine[] => lines.map(parseIngredientLine);

/** Enough measured lines to be worth scaling. */
export const isScalable = (lines: string[]): boolean =>
  parseIngredientLines(lines).filter((l) => l.kind === "measured").length >= 2;

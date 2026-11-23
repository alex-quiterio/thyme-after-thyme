import { formatAmount } from "@scaler/domain/scaling";
import type { ScaledLine } from "@scaler/domain/recipeScaling";
import { localizeDecimal, type Locale } from "@shared/locales";
import type { Unit } from "@shared/units";

/** "300 g", "6–8 tbsp", or just "3" for things you count. */
export function amountText(line: ScaledLine, locale: Locale, unitName: Record<Unit, string>): string {
  const n = (x: number) => localizeDecimal(formatAmount(x), locale);
  const quantity = line.max !== null ? `${n(line.min)}–${n(line.max)}` : n(line.min);
  return line.unit === "pcs" ? quantity : `${quantity} ${unitName[line.unit]}`;
}

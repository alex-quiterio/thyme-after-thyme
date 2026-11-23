/** Seasonal themes. Pure date logic, so it's easy to test and to change. */
export type Season = "xmas" | "nye";

/** The days each theme is on, as [month, day] (month 1–12), inclusive. Edit here to change them. */
const RULES: Array<{ season: Season; from: [number, number]; to: [number, number] }> = [
  { season: "xmas", from: [12, 24], to: [12, 26] }, // Christmas Eve, Christmas Day, St Stephen's / Boxing Day
  { season: "nye", from: [12, 31], to: [12, 31] }, // New Year's Eve
  { season: "nye", from: [1, 1], to: [1, 1] }, // New Year's Day: the party doesn't stop at midnight
];

const key = (month: number, day: number) => month * 100 + day;

export function seasonFor(date: Date): Season | null {
  const today = key(date.getMonth() + 1, date.getDate());
  return RULES.find((r) => today >= key(...r.from) && today <= key(...r.to))?.season ?? null;
}

export const isNewYearsDay = (date: Date): boolean => date.getMonth() === 0 && date.getDate() === 1;

/** The year being welcomed: on Dec 31 the next one, on Jan 1 this one. */
export const welcomedYear = (date: Date): number => date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);

export function msUntilMidnight(date: Date): number {
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - date.getTime();
}

/** `?theme=xmas`, `?theme=nye` force a theme (to preview it); `?theme=none` forces the plain look. */
export function themeOverride(search: string): Season | "none" | null {
  const value = new URLSearchParams(search).get("theme");
  return value === "xmas" || value === "nye" || value === "none" ? value : null;
}

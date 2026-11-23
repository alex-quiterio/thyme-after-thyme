/** Seasonal themes. Pure date logic, so it's easy to test and to change. */
export type Season = "xmas" | "nye" | "halloween" | "easter" | "spring" | "autumn";

/** A specific festive day, so greetings can be precise ("Boa Consoada" on 24 Dec, not just "Natal"). */
export type Occasion =
  | "xmas-eve"
  | "xmas-day"
  | "xmas-stephen"
  | "nye"
  | "new-year"
  | "halloween"
  | "all-saints"
  | "easter-weekend" // Good Friday and Holy Saturday
  | "easter"
  | "easter-monday"
  | "spring-equinox" // northern hemisphere: the March equinox
  | "autumn-equinox"; // the September equinox: the grape harvest in Portugal and Italy

/** Fixed-date occasions as [month 1–12, day]. Edit here to change when a theme is on. */
const FIXED: Array<{ occasion: Occasion; date: [number, number] }> = [
  { occasion: "xmas-eve", date: [12, 24] },
  { occasion: "xmas-day", date: [12, 25] },
  { occasion: "xmas-stephen", date: [12, 26] }, // St Stephen's / Boxing Day
  { occasion: "nye", date: [12, 31] },
  { occasion: "new-year", date: [1, 1] }, // the party doesn't stop at midnight
  { occasion: "halloween", date: [10, 30] },
  { occasion: "halloween", date: [10, 31] },
  { occasion: "all-saints", date: [11, 1] }, // Todos os Santos / Ognissanti
];

/** Easter Sunday (Gregorian calendar), by the Anonymous Gregorian algorithm. */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Whole days from Easter Sunday to `date` (calendar days, immune to daylight-saving changes). */
const daysFromEaster = (date: Date): number => {
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
  return day(date) - day(easterSunday(date.getFullYear()));
};

/**
 * The moment of the March or September equinox (Meeus, "Astronomical Algorithms", ch. 27),
 * accurate to a few minutes for the years that matter here. Returns the instant; use local
 * getters to get the calendar day wherever the viewer is.
 */
export function equinox(year: number, which: "march" | "september"): Date {
  const y = (year - 2000) / 1000;
  const jde0 =
    which === "march"
      ? 2451623.80984 + 365242.37404 * y + 0.05169 * y ** 2 - 0.00411 * y ** 3 - 0.00057 * y ** 4
      : 2451810.21715 + 365242.01767 * y - 0.11575 * y ** 2 + 0.00337 * y ** 3 + 0.00078 * y ** 4;

  const t = (jde0 - 2451545.0) / 36525;
  const w = ((35999.373 * t - 2.47) * Math.PI) / 180;
  const dLambda = 1 + 0.0334 * Math.cos(w) + 0.0007 * Math.cos(2 * w);
  // periodic terms: [A, B degrees, C degrees per century]
  const terms: Array<[number, number, number]> = [
    [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186], [182, 27.85, 445267.112],
    [156, 73.14, 45036.886], [136, 171.52, 22518.443], [77, 222.54, 65928.934], [74, 296.72, 3034.906],
    [70, 243.58, 9037.513], [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
    [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417], [18, 155.12, 67555.328],
    [17, 288.79, 4562.452], [16, 198.04, 62894.029], [14, 199.76, 31436.921], [12, 95.39, 14577.848],
    [12, 287.11, 31931.756], [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074],
  ];
  const sum = terms.reduce((acc, [a, b, c]) => acc + a * Math.cos(((b + c * t) * Math.PI) / 180), 0);
  const jde = jde0 + (0.00001 * sum) / dLambda;

  const deltaT = 69; // seconds between dynamical time and UT, about right for this century
  return new Date((jde - 2440587.5) * 86_400_000 - deltaT * 1000);
}

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function occasionFor(date: Date): Occasion | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixed = FIXED.find((f) => f.date[0] === month && f.date[1] === day);
  if (fixed) return fixed.occasion;

  const fromEaster = daysFromEaster(date);
  if (fromEaster === -2 || fromEaster === -1) return "easter-weekend";
  if (fromEaster === 0) return "easter";
  if (fromEaster === 1) return "easter-monday";

  // checked last, so a festival that happens to share the day wins
  if (sameLocalDay(date, equinox(date.getFullYear(), "march"))) return "spring-equinox";
  if (sameLocalDay(date, equinox(date.getFullYear(), "september"))) return "autumn-equinox";
  return null;
}

export function seasonOf(occasion: Occasion): Season {
  if (occasion.startsWith("xmas")) return "xmas";
  if (occasion === "nye" || occasion === "new-year") return "nye";
  if (occasion === "halloween" || occasion === "all-saints") return "halloween";
  if (occasion === "spring-equinox") return "spring";
  if (occasion === "autumn-equinox") return "autumn";
  return "easter";
}

export const seasonFor = (date: Date): Season | null => {
  const occasion = occasionFor(date);
  return occasion ? seasonOf(occasion) : null;
};

/** The occasion a preview link shows for a season. */
export const previewOccasion = (season: Season): Occasion =>
  ({ xmas: "xmas-day", nye: "nye", halloween: "halloween", easter: "easter", spring: "spring-equinox", autumn: "autumn-equinox" } as const)[season];

/** The year being welcomed: on Dec 31 the next one, on Jan 1 this one. */
export const welcomedYear = (date: Date): number => date.getFullYear() + (date.getMonth() === 11 ? 1 : 0);

export function msUntilMidnight(date: Date): number {
  const next = new Date(date);
  next.setHours(24, 0, 0, 0);
  return next.getTime() - date.getTime();
}

const SEASONS: readonly string[] = ["xmas", "nye", "halloween", "easter", "spring", "autumn"];

/** `?theme=xmas|nye|halloween|easter|spring|autumn` forces a theme (to preview it); `?theme=none` forces the plain look. */
export function themeOverride(search: string): Season | "none" | null {
  const value = new URLSearchParams(search).get("theme");
  return value === "none" || (value !== null && SEASONS.includes(value)) ? (value as Season | "none") : null;
}

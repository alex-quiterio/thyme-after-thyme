import { describe, expect, test } from "bun:test";
import { easterSunday, equinox, msUntilMidnight, occasionFor, previewOccasion, seasonFor, seasonOf, themeOverride, welcomedYear } from "./season";

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe("Christmas and New Year", () => {
  test("each day gets its own occasion", () => {
    expect([23, 24, 25, 26, 27].map((d) => occasionFor(day(2026, 12, d)))).toEqual([null, "xmas-eve", "xmas-day", "xmas-stephen", null]);
  });

  test("New Year's Eve and New Year's Day, across the year boundary", () => {
    expect(occasionFor(day(2026, 12, 30))).toBeNull();
    expect(occasionFor(day(2026, 12, 31, 0))).toBe("nye");
    expect(occasionFor(day(2026, 12, 31, 23))).toBe("nye");
    expect(occasionFor(day(2027, 1, 1, 0))).toBe("new-year");
    expect(occasionFor(day(2027, 1, 2))).toBeNull();
    expect(seasonFor(day(2027, 1, 1))).toBe("nye");
  });
});

describe("Halloween", () => {
  test("30 Oct to All Saints' Day on 1 Nov", () => {
    expect([29, 30, 31].map((d) => occasionFor(day(2026, 10, d)))).toEqual([null, "halloween", "halloween"]);
    expect(occasionFor(day(2026, 11, 1))).toBe("all-saints");
    expect(seasonFor(day(2026, 11, 1))).toBe("halloween");
    expect(occasionFor(day(2026, 11, 2))).toBeNull();
  });
});

describe("Easter moves every year", () => {
  test("Easter Sunday matches the known dates", () => {
    const known: Array<[number, number, number]> = [[2024, 3, 31], [2025, 4, 20], [2026, 4, 5], [2027, 3, 28], [2028, 4, 16], [2038, 4, 25], [2011, 4, 24]];
    for (const [y, m, d] of known) expect([easterSunday(y).getMonth() + 1, easterSunday(y).getDate()]).toEqual([m, d]);
  });

  test("Good Friday to Easter Monday, in different months by year", () => {
    // 2026: Easter is 5 April
    expect([2, 3, 4, 5, 6, 7].map((d) => occasionFor(day(2026, 4, d)))).toEqual([null, "easter-weekend", "easter-weekend", "easter", "easter-monday", null]);
    // 2027: Easter is 28 March
    expect([25, 26, 27, 28, 29].map((d) => occasionFor(day(2027, 3, d)))).toEqual([null, "easter-weekend", "easter-weekend", "easter", "easter-monday"]);
    expect(occasionFor(day(2027, 3, 30))).toBeNull();
  });

  test("a week that crosses a month end still works (Easter on 1 April 2018)", () => {
    expect([30, 31].map((d) => occasionFor(day(2018, 3, d)))).toEqual(["easter-weekend", "easter-weekend"]);
    expect(occasionFor(day(2018, 4, 1))).toBe("easter");
    expect(occasionFor(day(2018, 4, 2))).toBe("easter-monday");
  });

  test("daylight-saving changes don't shift it (clocks change around Easter)", () => {
    expect(occasionFor(new Date(2027, 2, 28, 0, 30))).toBe("easter"); // the night Europe changes the clocks
    expect(occasionFor(new Date(2027, 2, 28, 23, 30))).toBe("easter");
  });
});

describe("equinoxes", () => {
  const utc = (y: number, m: number, d: number, h: number, min: number) => Date.UTC(y, m - 1, d, h, min);
  // published equinox times (UTC); the algorithm should land within a few minutes
  const known: Array<["march" | "september", number, number, number, number, number]> = [
    ["march", 2024, 3, 20, 3, 6], ["september", 2024, 9, 22, 12, 44],
    ["march", 2025, 3, 20, 9, 1], ["september", 2025, 9, 22, 18, 19],
    ["march", 2026, 3, 20, 14, 46], ["september", 2026, 9, 23, 0, 5],
    ["march", 2027, 3, 20, 20, 25], ["september", 2027, 9, 23, 6, 2],
  ];

  test("matches published equinox times to within 10 minutes", () => {
    for (const [which, y, m, d, h, min] of known) {
      const off = Math.abs(equinox(y, which).getTime() - utc(y, m, d, h, min)) / 60_000;
      expect(off).toBeLessThan(10);
    }
  });

  test("the equinox day (wherever you are) gets the theme, the days around it don't", () => {
    for (const which of ["march", "september"] as const) {
      const e = equinox(2026, which);
      const noon = (offset: number) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + offset, 12);
      expect(occasionFor(noon(0))).toBe(which === "march" ? "spring-equinox" : "autumn-equinox");
      expect(occasionFor(noon(-1))).toBeNull();
      expect(occasionFor(noon(1))).toBeNull();
    }
  });

  test("they belong to the spring and autumn themes", () => {
    expect(seasonOf("spring-equinox")).toBe("spring");
    expect(seasonOf("autumn-equinox")).toBe("autumn");
  });
});

test("ordinary days are plain, whatever the year", () => {
  expect(seasonFor(day(2026, 11, 23))).toBeNull();
  expect(seasonFor(day(2030, 7, 4))).toBeNull();
  expect(seasonFor(day(2031, 12, 25))).toBe("xmas");
});

test("occasions belong to seasons, and previews pick a sensible occasion", () => {
  expect(seasonOf("xmas-stephen")).toBe("xmas");
  expect(seasonOf("all-saints")).toBe("halloween");
  expect(seasonOf("easter-monday")).toBe("easter");
  expect((["xmas", "nye", "halloween", "easter", "spring", "autumn"] as const).map((s) => seasonOf(previewOccasion(s)))).toEqual(["xmas", "nye", "halloween", "easter", "spring", "autumn"]);
});

test("which year is being welcomed, and time to midnight", () => {
  expect(welcomedYear(day(2026, 12, 31))).toBe(2027);
  expect(welcomedYear(day(2027, 1, 1))).toBe(2027);
  expect(msUntilMidnight(new Date(2026, 11, 31, 23, 59, 0))).toBe(60_000);
});

test("preview override from the URL", () => {
  for (const s of ["xmas", "nye", "halloween", "easter", "spring", "autumn", "none"]) expect(themeOverride(`?a=1&theme=${s}`)).toBe(s as never);
  expect(themeOverride("?theme=valentine")).toBeNull();
  expect(themeOverride("")).toBeNull();
});

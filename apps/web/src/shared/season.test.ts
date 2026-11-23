import { describe, expect, test } from "bun:test";
import { isNewYearsDay, msUntilMidnight, seasonFor, themeOverride, welcomedYear } from "./season";

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe("seasonFor", () => {
  test("Christmas Eve to St Stephen's day", () => {
    expect([23, 24, 25, 26, 27].map((d) => seasonFor(day(2026, 12, d)))).toEqual([null, "xmas", "xmas", "xmas", null]);
  });

  test("New Year's Eve and New Year's Day, across the year boundary", () => {
    expect(seasonFor(day(2026, 12, 30))).toBeNull();
    expect(seasonFor(day(2026, 12, 31, 0))).toBe("nye");
    expect(seasonFor(day(2026, 12, 31, 23))).toBe("nye");
    expect(seasonFor(day(2027, 1, 1, 0))).toBe("nye");
    expect(seasonFor(day(2027, 1, 2))).toBeNull();
  });

  test("ordinary days are plain, whatever the year", () => {
    expect(seasonFor(day(2026, 11, 23))).toBeNull();
    expect(seasonFor(day(2030, 7, 4))).toBeNull();
    expect(seasonFor(day(2031, 12, 25))).toBe("xmas");
  });
});

test("which year is being welcomed", () => {
  expect(welcomedYear(day(2026, 12, 31))).toBe(2027);
  expect(welcomedYear(day(2027, 1, 1))).toBe(2027);
  expect(isNewYearsDay(day(2027, 1, 1))).toBe(true);
  expect(isNewYearsDay(day(2026, 12, 31))).toBe(false);
});

test("time left until midnight", () => {
  expect(msUntilMidnight(new Date(2026, 11, 31, 23, 59, 0))).toBe(60_000);
  expect(msUntilMidnight(new Date(2026, 11, 31, 21, 0, 0))).toBe(3 * 3_600_000);
});

test("preview override from the URL", () => {
  expect(themeOverride("?theme=xmas")).toBe("xmas");
  expect(themeOverride("?a=1&theme=nye")).toBe("nye");
  expect(themeOverride("?theme=none")).toBe("none");
  expect(themeOverride("?theme=halloween")).toBeNull();
  expect(themeOverride("")).toBeNull();
});

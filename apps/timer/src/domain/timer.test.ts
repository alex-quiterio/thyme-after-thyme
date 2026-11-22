import { describe, expect, test } from "bun:test";
import { createTimer, formatRemaining, pause, remainingMs, reset, start, tick } from "./timer";

const base = () => createTimer("a", "Pasta", 10 * 60_000);

describe("timer", () => {
  test("counts down from wall-clock time", () => {
    const t = start(base(), 1_000);
    expect(remainingMs(t, 1_000 + 60_000)).toBe(9 * 60_000);
  });

  test("pause freezes and resume continues", () => {
    const paused = pause(start(base(), 0), 60_000);
    expect(paused.remainingMs).toBe(9 * 60_000);
    expect(remainingMs(paused, 999_999)).toBe(9 * 60_000);
    const resumed = start(paused, 100_000);
    expect(remainingMs(resumed, 100_000 + 1_000)).toBe(9 * 60_000 - 1_000);
  });

  test("tick finishes only when time is up", () => {
    const t = start(base(), 0);
    expect(tick(t, 599_999).status).toBe("running");
    const done = tick(t, 600_000);
    expect(done.status).toBe("finished");
    expect(done.remainingMs).toBe(0);
  });

  test("starting a finished timer restarts from full duration", () => {
    const done = tick(start(base(), 0), 600_000);
    expect(remainingMs(start(done, 700_000), 700_000)).toBe(600_000);
  });

  test("reset returns to idle", () => {
    expect(reset(pause(start(base(), 0), 5_000))).toMatchObject({ status: "idle", remainingMs: 600_000 });
  });

  test("rejects non-positive duration", () => {
    expect(() => createTimer("x", "x", 0)).toThrow();
  });

  test("formats", () => {
    expect(formatRemaining(83_000)).toBe("01:23");
    expect(formatRemaining(3_725_000)).toBe("1:02:05");
    expect(formatRemaining(500)).toBe("00:01");
    expect(formatRemaining(0)).toBe("00:00");
  });
});

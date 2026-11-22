import { describe, expect, test } from "bun:test";
import { createTimer, formatRemaining, pause, remainingMs, reset, restoreTimers, start, tick } from "./timer";

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

describe("restoreTimers", () => {
  const saved = (t: object) => JSON.parse(JSON.stringify([t]));

  test("a running timer keeps counting while the app was closed", () => {
    const running = start(base(), 1_000);
    const [restored] = restoreTimers(saved(running));
    expect(remainingMs(restored!, 61_000)).toBe(9 * 60_000);
    expect(tick(restored!, 700_000).status).toBe("finished");
  });

  test("paused and finished timers come back as they were", () => {
    const paused = pause(start(base(), 0), 120_000);
    expect(restoreTimers(saved(paused))[0]).toMatchObject({ status: "paused", remainingMs: 8 * 60_000, endsAt: null });
    const done = tick(start(base(), 0), 600_000);
    expect(restoreTimers(saved(done))[0]).toMatchObject({ status: "finished", remainingMs: 0 });
  });

  test("bad data is dropped or repaired, never thrown", () => {
    expect(restoreTimers(null)).toEqual([]);
    expect(restoreTimers("nope")).toEqual([]);
    expect(restoreTimers([null, 3, { id: "x" }, { id: "a", label: "A", durationMs: -5, status: "idle" }, { id: "b", label: "B", durationMs: 1000, status: "weird" }])).toEqual([]);
    const [fixed] = restoreTimers([{ id: "a", label: "A", durationMs: 1000, status: "running", sound: "kazoo" }]);
    expect(fixed).toMatchObject({ status: "paused", sound: "ring", remainingMs: 1000 }); // running without an end time can't run
  });
});

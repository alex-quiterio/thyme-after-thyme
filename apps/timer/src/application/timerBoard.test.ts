import { describe, expect, test } from "bun:test";
import { createTimerBoard } from "./timerBoard";
import type { Alarm } from "./ports";

function setup() {
  let now = 0;
  let n = 0;
  const calls: string[] = [];
  const alarm: Alarm = {
    unlock: () => calls.push("unlock"),
    ring: (id, s) => calls.push(`ring:${id}:${s}`),
    silence: (id) => calls.push(`silence:${id}`),
    preview: (s) => calls.push(`preview:${s}`),
  };
  const board = createTimerBoard({ clock: { now: () => now }, alarm, newId: () => `t${++n}` });
  return { board, calls, advance: (ms: number) => void (now += ms) };
}

describe("timer board", () => {
  test("a finished timer rings once, and starting it again silences it", () => {
    const { board, calls, advance } = setup();
    const id = board.add("Pasta", 60_000, "chime");
    board.start(id);
    advance(59_000);
    board.tick();
    expect(calls.filter((c) => c.startsWith("ring"))).toEqual([]);
    advance(1_000);
    board.tick();
    board.tick();
    expect(calls.filter((c) => c.startsWith("ring"))).toEqual(["ring:t1:chime"]);
    expect(board.getState().timers[0]?.status).toBe("finished");
    board.reset(id);
    expect(calls.at(-1)).toBe("silence:t1");
  });

  test("blank labels fall back and remove silences", () => {
    const { board, calls } = setup();
    const id = board.add("  ", 1000);
    expect(board.getState().timers[0]?.label).toBe("Timer");
    board.remove(id);
    expect(board.getState().timers).toHaveLength(0);
    expect(calls).toContain("silence:t1");
  });

  test("notifies subscribers", () => {
    const { board } = setup();
    let hits = 0;
    const off = board.subscribe(() => hits++);
    board.add("Tea", 1000);
    off();
    board.add("Rice", 1000);
    expect(hits).toBe(1);
  });
});

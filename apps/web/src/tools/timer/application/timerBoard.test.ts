import { describe, expect, test } from "bun:test";
import { createTimerBoard } from "./timerBoard";
import type { Alarm, TimerStorage } from "./ports";
import type { Timer } from "@timer/domain/timer";

function setup(saved: Timer[] = [], start = 0) {
  let now = start;
  let n = 0;
  const calls: string[] = [];
  const alarm: Alarm = {
    unlock: () => calls.push("unlock"),
    ring: (t) => calls.push(`ring:${t.id}:${t.sound}`),
    silence: (id) => calls.push(`silence:${id}`),
    preview: (s) => calls.push(`preview:${s}`),
  };
  const saves: Timer[][] = [];
  const storage: TimerStorage = { load: () => saved, save: (t) => void saves.push(t) };
  const board = createTimerBoard({ clock: { now: () => now }, alarm, newId: () => `t${++n}`, storage });
  return { board, calls, saves, advance: (ms: number) => void (now += ms) };
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

  test("every change is saved", () => {
    const { board, saves } = setup();
    const id = board.add("Tea", 60_000);
    board.start(id);
    board.pause(id);
    board.remove(id);
    expect(saves.map((s) => s.length)).toEqual([1, 1, 1, 0]);
    expect(saves[1]![0]?.status).toBe("running");
  });

  test("timers saved earlier are back, still counting", () => {
    const { board: first, saves } = setup();
    const id = first.add("Roast", 600_000);
    first.start(id);
    const { board, advance } = setup(JSON.parse(JSON.stringify(saves.at(-1))), 100_000);
    expect(board.getState().timers[0]).toMatchObject({ label: "Roast", status: "running" });
    advance(0);
    expect(board.getState().timers).toHaveLength(1);
  });

  test("a timer that ran out while the app was closed rings on the first tick, once", () => {
    const first = setup();
    const id = first.board.add("Eggs", 60_000);
    first.board.start(id);
    const saved = JSON.parse(JSON.stringify(first.saves.at(-1)));
    const { board, calls, saves } = setup(saved, 10 * 60_000);
    expect(calls).toEqual([]);
    board.tick();
    board.tick();
    expect(calls).toEqual(["ring:t1:ring"]);
    expect(board.getState().timers[0]?.status).toBe("finished");
    expect(saves).toHaveLength(1); // saved when it finished, not on every tick
  });
});

// Glue: lets the recipe book start timers on the Timers board without either tool knowing the other.
import type { StepTimers, StepTimerState } from "@recipes/application/ports";
import type { BoardState, TimerBoard } from "@timer/application/timerBoard";
import { remainingMs } from "@timer/domain/timer";

const NONE: Readonly<Record<string, StepTimerState>> = {};

export function createRecipeTimers(board: TimerBoard): StepTimers {
  const timerIds = new Map<string, string>(); // recipe step key -> timer id on the board
  let seen: BoardState | null = null;
  let cached = NONE;

  return {
    start(key, label, durationMs) {
      const previous = timerIds.get(key);
      if (previous) board.remove(previous);
      const id = board.add(label, durationMs, "chime");
      timerIds.set(key, id);
      board.start(id);
    },

    stop(key) {
      const id = timerIds.get(key);
      if (id) board.remove(id);
      timerIds.delete(key);
    },

    subscribe: board.subscribe,

    snapshot() {
      const state = board.getState();
      if (state === seen) return cached;
      seen = state;
      const next: Record<string, StepTimerState> = {};
      for (const [key, id] of timerIds) {
        const t = state.timers.find((x) => x.id === id);
        if (t) next[key] = { status: t.status === "idle" ? "paused" : t.status, remainingMs: remainingMs(t, state.now) };
      }
      cached = Object.keys(next).length ? next : NONE;
      return cached;
    },
  };
}

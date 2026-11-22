// Glue: lets the recipe book start timers on the Timers board without either tool knowing the other.
import type { StepTimers, StepTimerState } from "@recipes/application/ports";
import type { BoardState, TimerBoard } from "@timer/application/timerBoard";
import { remainingMs } from "@timer/domain/timer";

const NONE: Readonly<Record<string, StepTimerState>> = {};
const KEY = "thyme-after-thyme.recipe-timers.v1";

function loadLinks(): Map<string, string> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, unknown>;
    return new Map(Object.entries(saved).filter((e): e is [string, string] => typeof e[1] === "string"));
  } catch {
    return new Map();
  }
}

export function createRecipeTimers(board: TimerBoard): StepTimers {
  // recipe step key -> timer id on the board, kept so a reload doesn't disconnect running step timers
  const timerIds = loadLinks();
  const saveLinks = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(timerIds)));
    } catch {
      // not persisted
    }
  };
  let seen: BoardState | null = null;
  let cached = NONE;

  return {
    start(key, label, durationMs) {
      const previous = timerIds.get(key);
      if (previous) board.remove(previous);
      const id = board.add(label, durationMs, "chime");
      timerIds.set(key, id);
      saveLinks();
      board.start(id);
    },

    stop(key) {
      const id = timerIds.get(key);
      if (id) board.remove(id);
      timerIds.delete(key);
      saveLinks();
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

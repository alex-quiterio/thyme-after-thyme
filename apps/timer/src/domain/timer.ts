/**
 * Pure countdown timer state. Remaining time is derived from a wall-clock
 * `endsAt` timestamp rather than decremented per tick, so it stays accurate
 * when the browser throttles background tabs.
 */
export type TimerStatus = "idle" | "running" | "paused" | "finished";

export const alarmSounds = ["ring", "alarm", "ding", "chime"] as const;
export type AlarmSound = (typeof alarmSounds)[number];

export type Timer = {
  id: string;
  label: string;
  durationMs: number;
  sound: AlarmSound;
  status: TimerStatus;
  /** Remaining time when not running. */
  remainingMs: number;
  /** Epoch ms when it finishes; only set while running. */
  endsAt: number | null;
};

export function createTimer(
  id: string,
  label: string,
  durationMs: number,
  sound: AlarmSound = "ring",
): Timer {
  if (!(durationMs > 0)) throw new Error("durationMs must be positive");
  return { id, label, durationMs, sound, status: "idle", remainingMs: durationMs, endsAt: null };
}

export function remainingMs(timer: Timer, now: number): number {
  return timer.status === "running" && timer.endsAt !== null
    ? Math.max(0, timer.endsAt - now)
    : timer.remainingMs;
}

export function start(timer: Timer, now: number): Timer {
  if (timer.status === "running") return timer;
  const base = timer.status === "finished" ? timer.durationMs : timer.remainingMs;
  return { ...timer, status: "running", remainingMs: base, endsAt: now + base };
}

export function pause(timer: Timer, now: number): Timer {
  if (timer.status !== "running") return timer;
  return { ...timer, status: "paused", remainingMs: remainingMs(timer, now), endsAt: null };
}

export function reset(timer: Timer): Timer {
  return { ...timer, status: "idle", remainingMs: timer.durationMs, endsAt: null };
}

/** Moves a running timer to "finished" once its time is up. */
export function tick(timer: Timer, now: number): Timer {
  if (timer.status === "running" && remainingMs(timer, now) === 0) {
    return { ...timer, status: "finished", remainingMs: 0, endsAt: null };
  }
  return timer;
}

/** 83_000 -> "01:23", 3_725_000 -> "1:02:05". Rounds up so 0:00 means done. */
export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

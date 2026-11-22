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

/**
 * Rebuilds timers from whatever was saved. Bad entries are dropped, odd values repaired.
 * A running timer keeps its absolute end time, so time spent away still counts.
 */
export function restoreTimers(data: unknown): Timer[] {
  if (!Array.isArray(data)) return [];
  const statuses: TimerStatus[] = ["idle", "running", "paused", "finished"];
  const timers: Timer[] = [];
  for (const raw of data) {
    if (typeof raw !== "object" || raw === null) continue;
    const t = raw as Record<string, unknown>;
    if (typeof t.id !== "string" || typeof t.label !== "string") continue;
    if (!(typeof t.durationMs === "number" && t.durationMs > 0)) continue;
    const status = statuses.find((x) => x === t.status);
    if (!status) continue;
    const sound = alarmSounds.find((x) => x === t.sound) ?? "ring";
    const remaining = typeof t.remainingMs === "number" && t.remainingMs >= 0 ? Math.min(t.remainingMs, t.durationMs) : t.durationMs;

    if (status === "running") {
      if (typeof t.endsAt === "number") timers.push({ id: t.id, label: t.label, durationMs: t.durationMs, sound, status, remainingMs: remaining, endsAt: t.endsAt });
      else timers.push({ id: t.id, label: t.label, durationMs: t.durationMs, sound, status: "paused", remainingMs: remaining, endsAt: null });
    } else {
      timers.push({ id: t.id, label: t.label, durationMs: t.durationMs, sound, status, remainingMs: status === "finished" ? 0 : remaining, endsAt: null });
    }
  }
  return timers;
}

export { formatClock as formatRemaining } from "@shared/formatClock";

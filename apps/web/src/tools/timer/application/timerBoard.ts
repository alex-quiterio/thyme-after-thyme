import {
  addTime as addTimeTo,
  createTimer,
  pause as pauseTimer,
  reset as resetTimer,
  start as startTimer,
  tick as tickTimer,
  type AlarmSound,
  type Timer,
} from "@timer/domain/timer";
import type { Alarm, Clock, TimerStorage } from "./ports";

export type BoardState = { timers: Timer[]; now: number };

export type Ports = { clock: Clock; alarm: Alarm; newId: () => string; storage: TimerStorage };

export type TimerBoard = ReturnType<typeof createTimerBoard>;

/** Use cases for a kitchen full of timers. Pure orchestration: time and sound come in as ports. */
export function createTimerBoard({ clock, alarm, newId, storage }: Ports) {
  // Timers saved earlier come back as they were; a running one whose time ran out while
  // the app was closed finishes (and rings) on the first tick.
  let state: BoardState = { timers: storage.load(), now: clock.now() };
  const listeners = new Set<() => void>();

  const commit = (timers: Timer[]) => {
    state = { timers, now: clock.now() };
    storage.save(timers);
    listeners.forEach((l) => l());
  };
  const update = (id: string, change: (t: Timer) => Timer) =>
    commit(state.timers.map((t) => (t.id === id ? change(t) : t)));

  const getState = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  };

  const add = (label: string, durationMs: number, sound: AlarmSound = "ring"): string => {
    alarm.unlock();
    const id = newId();
    commit([...state.timers, createTimer(id, label.trim() || "Timer", durationMs, sound)]);
    return id;
  };

  const start = (id: string) => {
    alarm.unlock();
    alarm.silence(id);
    update(id, (t) => startTimer(t, clock.now()));
  };
  const addTime = (id: string, ms: number) => {
    alarm.unlock();
    alarm.silence(id); // "one more minute" also stops the ringing
    update(id, (t) => addTimeTo(t, ms, clock.now()));
  };
  const pause = (id: string) => update(id, (t) => pauseTimer(t, clock.now()));
  const reset = (id: string) => {
    alarm.silence(id);
    update(id, resetTimer);
  };
  const remove = (id: string) => {
    alarm.silence(id);
    commit(state.timers.filter((t) => t.id !== id));
  };
  const setSound = (id: string, sound: AlarmSound) => {
    alarm.unlock();
    alarm.preview(sound);
    update(id, (t) => ({ ...t, sound }));
  };

  /** Call regularly: refreshes `now` and rings any timer that just finished. */
  const tick = () => {
    const now = clock.now();
    let finished = false;
    const timers = state.timers.map((t) => {
      const next = tickTimer(t, now);
      if (next !== t) {
        finished = true;
        alarm.ring(next);
      }
      return next;
    });
    state = { timers, now };
    if (finished) storage.save(timers);
    listeners.forEach((l) => l());
  };

  return { getState, subscribe, add, start, pause, addTime, reset, remove, setSound, tick };
}

import type { AlarmSound, Timer } from "@timer/domain/timer";

export type Clock = { now(): number };

/** Something that can make noise when a timer finishes. */
export type Alarm = {
  /** Call from a user gesture; browsers block audio before one. */
  unlock(): void;
  /** Alerts the user (sound, notification, vibration...) until `silence(timer.id)`. */
  ring(timer: Pick<Timer, "id" | "label" | "sound">): void;
  silence(timerId: string): void;
  /** One short play, for trying a sound out. */
  preview(sound: AlarmSound): void;
};

/** Where timers survive reloads and app updates. */
export type TimerStorage = {
  load(): Timer[];
  save(timers: Timer[]): void;
};

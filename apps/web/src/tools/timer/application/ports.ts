import type { AlarmSound } from "@timer/domain/timer";

export type Clock = { now(): number };

/** Something that can make noise when a timer finishes. */
export type Alarm = {
  /** Call from a user gesture; browsers block audio before one. */
  unlock(): void;
  /** Rings (looping) until `silence(timerId)`. */
  ring(timerId: string, sound: AlarmSound): void;
  silence(timerId: string): void;
  /** One short play, for trying a sound out. */
  preview(sound: AlarmSound): void;
};

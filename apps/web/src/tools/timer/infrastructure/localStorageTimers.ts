import type { TimerStorage } from "@timer/application/ports";
import { restoreTimers } from "@timer/domain/timer";

const KEY = "thyme-after-thyme.timers.v1";

export function createLocalStorageTimers(): TimerStorage {
  return {
    load() {
      try {
        return restoreTimers(JSON.parse(localStorage.getItem(KEY) ?? "null"));
      } catch {
        return [];
      }
    },
    save(timers) {
      try {
        localStorage.setItem(KEY, JSON.stringify(timers));
      } catch {
        // storage full or blocked: timers just won't survive a reload
      }
    },
  };
}

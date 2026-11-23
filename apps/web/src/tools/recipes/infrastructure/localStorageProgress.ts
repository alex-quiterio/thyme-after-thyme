import type { ProgressStorage } from "@recipes/application/ports";

const KEY = "thyme-after-thyme.recipe-progress.v1";

export function createLocalStorageProgress(): ProgressStorage {
  return {
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, unknown>;
        const out: Record<string, string[]> = {};
        for (const [id, keys] of Object.entries(saved)) {
          if (Array.isArray(keys)) out[id] = keys.filter((k): k is string => typeof k === "string");
        }
        return out;
      } catch {
        return {};
      }
    },
    save(progress) {
      try {
        localStorage.setItem(KEY, JSON.stringify(progress));
      } catch {
        // not remembered; ticks still work until the page closes
      }
    },
  };
}

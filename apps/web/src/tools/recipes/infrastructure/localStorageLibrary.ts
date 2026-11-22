import type { LibraryState, LibraryStorage, RawRecipe } from "@recipes/application/ports";
import { locales } from "@shared/locales";

const KEY = "thyme-after-thyme.recipe-library.v1";

const empty = (): LibraryState => ({ imported: { en: [], pt: [], it: [] }, hidden: [] });

const isDoc = (d: unknown): d is RawRecipe =>
  typeof d === "object" && d !== null && typeof (d as { name?: unknown }).name === "string" && ("markdown" in d || "json" in d);

export function createLocalStorageLibrary(): LibraryStorage {
  return {
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<LibraryState> | null;
        const state = empty();
        for (const l of locales) {
          const list = saved?.imported?.[l];
          if (Array.isArray(list)) state.imported[l] = list.filter(isDoc);
        }
        if (Array.isArray(saved?.hidden)) state.hidden = saved.hidden.filter((x): x is string => typeof x === "string");
        return state;
      } catch {
        return empty();
      }
    },
    save(state) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        // storage full or blocked: the change lasts until the page is closed
      }
    },
  };
}

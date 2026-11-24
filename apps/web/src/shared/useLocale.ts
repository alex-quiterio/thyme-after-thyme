import { useSyncExternalStore } from "react";
import { isLocale, type Locale, type Localized } from "./locales";

const KEY = "thyme-after-thyme.locale";

/** A language chosen by the link itself, e.g. `?lang=pt`. */
function fromUrl(): Locale | null {
  try {
    const wanted = new URLSearchParams(window.location.search).get("lang")?.slice(0, 2).toLowerCase();
    return isLocale(wanted) ? wanted : null;
  } catch {
    return null;
  }
}

function detect(): Locale {
  const linked = fromUrl();
  if (linked) {
    try {
      localStorage.setItem(KEY, linked);
    } catch {
      // not persisted; still applies for this visit
    }
    return linked;
  }
  try {
    const saved = localStorage.getItem(KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // storage blocked: fall through to the browser language
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.slice(0, 2).toLowerCase();
    if (isLocale(base)) return base;
  }
  return "en";
}

let current: Locale = typeof window === "undefined" ? "en" : detect();
if (typeof document !== "undefined") document.documentElement.lang = current;

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

export function setLocale(next: Locale): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // not persisted; still applies for this visit
  }
  document.documentElement.lang = next;
  listeners.forEach((l) => l());
}

export const useLocale = (): Locale => useSyncExternalStore(subscribe, () => current);

/** The messages for the current language. */
export const useMessages = <T,>(messages: Localized<T>): T => messages[useLocale()];

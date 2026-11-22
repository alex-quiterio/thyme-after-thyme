import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const read = () => window.location.hash;

/** The recipe id in `#/recipes/<id>`, or null for the list. */
export function useRecipeRoute(): string | null {
  const hash = useSyncExternalStore(subscribe, read);
  const m = hash.match(/^#\/recipes\/(.+)$/);
  return m ? decodeURIComponent(m[1]!) : null;
}

import { useState } from "react";

/** useState that remembers its value on this device. Falls back quietly where storage is blocked. */
export function useStoredState<T extends string | boolean>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return initial;
      return (typeof initial === "boolean" ? saved === "true" : saved) as T;
    } catch {
      return initial;
    }
  });
  const update = (next: T) => {
    setValue(next);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      // not remembered
    }
  };
  return [value, update];
}

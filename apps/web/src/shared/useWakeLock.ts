import { useEffect } from "react";

/** Keeps the screen on while `active` and the page is visible. Quietly does nothing where unsupported. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const take = async () => {
      if (cancelled || lock || document.visibilityState !== "visible") return;
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => (lock = null));
      } catch {
        lock = null; // denied (battery saver...): not essential
      }
    };
    void take();
    const onVisible = () => void take(); // the browser drops the lock when the page is hidden
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      void lock?.release();
    };
  }, [active]);
}

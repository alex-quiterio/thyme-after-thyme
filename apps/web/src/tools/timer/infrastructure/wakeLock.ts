import type { TimerBoard } from "@timer/application/timerBoard";

/** Keeps the screen on while a timer is running (released as soon as none are). No-op if unsupported. */
export function keepAwakeWhileRunning(board: TimerBoard): void {
  if (!("wakeLock" in navigator)) return;
  let lock: WakeLockSentinel | null = null;
  let busy = false;

  const sync = async () => {
    if (busy) return;
    busy = true;
    try {
      const wanted = board.getState().timers.some((t) => t.status === "running");
      if (wanted && !lock && document.visibilityState === "visible") {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => (lock = null));
      } else if (!wanted && lock) {
        await lock.release();
        lock = null;
      }
    } catch {
      lock = null; // denied (battery saver, no user activation...): not essential
    } finally {
      busy = false;
    }
  };

  board.subscribe(() => void sync());
  // the browser drops the lock when the page is hidden; take it again on return
  document.addEventListener("visibilitychange", () => void sync());
  void sync();
}

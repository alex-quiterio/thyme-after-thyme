/** Non-sound ways to get noticed while timers ring: vibration, a flashing tab title, an app badge. */
export function createAttention() {
  const ringing = new Map<string, string>(); // timer id -> label
  let flash: ReturnType<typeof setInterval> | undefined;
  let originalTitle = "";
  let on = false;

  const render = () => {
    const [label] = [...ringing.values()].slice(-1);
    on = !on;
    document.title = on && label ? `⏰ ${label}` : originalTitle;
    if (ringing.size > 0 && "vibrate" in navigator) navigator.vibrate([300, 150, 300, 150, 600]);
  };

  const refresh = () => {
    if (ringing.size > 0 && flash === undefined) {
      originalTitle = document.title;
      flash = setInterval(render, 1500);
      render();
    } else if (ringing.size === 0 && flash !== undefined) {
      clearInterval(flash);
      flash = undefined;
      document.title = originalTitle;
      on = false;
    }
    const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (ringing.size > 0) void nav.setAppBadge?.(ringing.size).catch(() => {});
    else void nav.clearAppBadge?.().catch(() => {});
  };

  return {
    start(timer: { id: string; label: string }) {
      ringing.set(timer.id, timer.label);
      refresh();
    },
    stop(timerId: string) {
      ringing.delete(timerId);
      refresh();
    },
  };
}

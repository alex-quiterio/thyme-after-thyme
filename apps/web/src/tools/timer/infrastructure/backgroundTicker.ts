/**
 * Calls `onTick` every `everyMs`. Browsers slow main-thread timers in background tabs (to once a
 * second, then once a minute), which delays the alarm. A worker's timer isn't throttled that way.
 * Falls back to a plain interval where workers are unavailable.
 */
export function startTicker(onTick: () => void, everyMs = 250): () => void {
  try {
    const url = URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${everyMs})`], { type: "text/javascript" }));
    const worker = new Worker(url);
    worker.onmessage = onTick;
    return () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    const id = setInterval(onTick, everyMs);
    return () => clearInterval(id);
  }
}

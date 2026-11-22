/**
 * Service worker registration plus an "update ready" signal for the UI.
 *
 * A new version installs in the background and *waits*. The page shows a prompt;
 * only when the user accepts do we tell the waiting worker to take over and reload.
 */
let waiting: ServiceWorker | null = null;
let applying = false;
const listeners = new Set<() => void>();

const setWaiting = (worker: ServiceWorker | null) => {
  waiting = worker;
  listeners.forEach((l) => l());
};

export const appUpdate = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** The waiting service worker, or null when the app is up to date. */
  snapshot: () => waiting,
  /** Activates the new version; the page reloads when it takes control. */
  apply() {
    applying = true;
    waiting?.postMessage({ type: "SKIP_WAITING" });
  },
};

const CHECK_EVERY_MS = 30 * 60 * 1000;

/** Makes the app installable and offline-capable. Fails silently (e.g. in the dev server). */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Also fires on the very first install; only reload when the user asked for an update.
    if (applying) window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(new URL("sw.js", document.baseURI).href);
      const hasPreviousVersion = () => navigator.serviceWorker.controller !== null;

      if (registration.waiting && hasPreviousVersion()) setWaiting(registration.waiting);

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && hasPreviousVersion()) setWaiting(installing);
        });
      });

      // Installed apps stay open for days: look for a new version now and then, and on return.
      const check = () => void registration.update().catch(() => {});
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    } catch {
      // no service worker: the app still works online
    }
  });
}

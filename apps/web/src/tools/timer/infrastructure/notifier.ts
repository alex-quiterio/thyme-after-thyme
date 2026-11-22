/** System notifications for finished timers, shown only when the app isn't in front. */
export function createNotifier() {
  const supported = typeof Notification !== "undefined";
  const icon = new URL("icons/icon-192.png", document.baseURI).href;

  const registration = async () => {
    try {
      return (await navigator.serviceWorker?.getRegistration()) ?? null;
    } catch {
      return null;
    }
  };

  return {
    /** Asks once, from a user gesture (starting a timer), never on page load. */
    requestPermission() {
      if (supported && Notification.permission === "default") void Notification.requestPermission().catch(() => {});
    },

    async show(timer: { id: string; label: string }) {
      if (!supported || Notification.permission !== "granted" || document.hasFocus()) return;
      const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
        body: timer.label,
        tag: timer.id,
        icon,
        badge: icon,
        requireInteraction: true,
        renotify: true,
        vibrate: [300, 150, 300, 150, 600],
      };
      const reg = await registration();
      if (reg) await reg.showNotification("⏲️ " + timer.label, options).catch(() => {});
      else new Notification("⏲️ " + timer.label, options);
    },

    async close(timerId: string) {
      const reg = await registration();
      (await reg?.getNotifications(timerId === "*" ? undefined : { tag: timerId }))?.forEach((n) => n.close());
    },
  };
}

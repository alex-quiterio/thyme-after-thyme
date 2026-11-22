import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt(): Promise<void> };

/** Returns a function that opens the browser's install dialog, or null when installing isn't possible. */
export function useInstallPrompt(): (() => void) | null {
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return event
    ? () => {
        void event.prompt();
        setEvent(null);
      }
    : null;
}

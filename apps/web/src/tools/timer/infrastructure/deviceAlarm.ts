import type { Alarm } from "@timer/application/ports";
import { createAttention } from "./attention";
import { createNotifier } from "./notifier";
import { createWebAudioAlarm } from "./webAudioAlarm";

/** Layered alerts: sound, system notification, vibration, flashing title and app badge. */
export function createDeviceAlarm(): Alarm {
  const sound = createWebAudioAlarm();
  const notifier = createNotifier();
  const attention = createAttention();

  // Coming back to the app is enough acknowledgement for the notification (the sound keeps going).
  window.addEventListener("focus", () => void notifier.close("*"));

  return {
    unlock() {
      sound.unlock();
      notifier.requestPermission();
    },
    ring(timer) {
      sound.ring(timer);
      void notifier.show(timer);
      attention.start(timer);
    },
    silence(timerId) {
      sound.silence(timerId);
      void notifier.close(timerId);
      attention.stop(timerId);
    },
    preview: sound.preview,
  };
}

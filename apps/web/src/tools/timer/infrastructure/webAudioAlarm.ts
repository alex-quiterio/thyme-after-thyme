import { createKitchenSounds, type SoundHandle } from "@kitchen/sounds";
import type { Alarm } from "@timer/application/ports";

/** The sound part of the alarm. */
export function createWebAudioAlarm(): Alarm {
  const sounds = createKitchenSounds();
  const ringing = new Map<string, SoundHandle>();

  const silence = (timerId: string) => {
    ringing.get(timerId)?.stop();
    ringing.delete(timerId);
  };
  const unlock = () => void sounds.unlock();

  // After a reload there's been no tap yet, so the browser keeps audio muted; the first touch frees it.
  for (const event of ["pointerdown", "keydown"] as const) document.addEventListener(event, unlock, { once: true, capture: true });

  return {
    unlock,
    ring(timer) {
      silence(timer.id);
      ringing.set(timer.id, sounds.play(timer.sound, { loop: true, volume: 0.9 }));
    },
    silence,
    preview: (sound) => void sounds.play(sound, { volume: 0.7 }),
  };
}

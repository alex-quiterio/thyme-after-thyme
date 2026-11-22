import { createKitchenSounds, type SoundHandle } from "@kitchen/sounds";
import type { Alarm } from "@application/ports";

export function createWebAudioAlarm(): Alarm {
  const sounds = createKitchenSounds();
  const ringing = new Map<string, SoundHandle>();

  const silence = (timerId: string) => {
    ringing.get(timerId)?.stop();
    ringing.delete(timerId);
  };

  return {
    unlock: () => void sounds.unlock(),
    ring(timerId, sound) {
      silence(timerId);
      ringing.set(timerId, sounds.play(sound, { loop: true, volume: 0.9 }));
    },
    silence,
    preview: (sound) => void sounds.play(sound, { volume: 0.7 }),
  };
}

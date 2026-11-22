import { recipes, type SoundName } from "./recipes";

export type PlayOptions = {
  /** 0..1, default 0.8 */
  volume?: number;
  /** Repeat until `stop()` is called. Default false. */
  loop?: boolean;
};

export type SoundHandle = {
  /** Stops the sound with a short fade to avoid a click. Safe to call twice. */
  stop(): void;
};

export type KitchenSounds = {
  /** Call from a user gesture (click/tap): browsers keep audio suspended until then. */
  unlock(): Promise<void>;
  play(name: SoundName, options?: PlayOptions): SoundHandle;
  /** Stops everything currently playing. */
  stopAll(): void;
};

export type CreateOptions = {
  /** Inject an AudioContext (tests, or sharing one with the rest of the app). */
  audioContext?: AudioContext;
};

const FADE_SECONDS = 0.04;

export function createKitchenSounds(options: CreateOptions = {}): KitchenSounds {
  let ctx = options.audioContext ?? null;
  const active = new Set<SoundHandle>();

  const context = (): AudioContext => (ctx ??= new AudioContext());

  return {
    async unlock() {
      const c = context();
      if (c.state === "suspended") await c.resume();
    },

    play(name, { volume = 0.8, loop = false } = {}) {
      const recipe = recipes[name];
      const c = context();
      // Best effort: if called inside a gesture this resumes; otherwise it stays silent.
      if (c.state === "suspended") void c.resume();

      const master = c.createGain();
      master.gain.value = Math.min(1, Math.max(0, volume));
      master.connect(c.destination);

      let timer: ReturnType<typeof setTimeout> | undefined;
      let stopped = false;

      const pass = (when: number) => {
        const length = recipe(c, master, when);
        if (!loop) {
          timer = setTimeout(() => handle.stop(), (when - c.currentTime + length) * 1000);
          return;
        }
        // Schedule the next pass just before this one ends.
        timer = setTimeout(() => !stopped && pass(when + length), Math.max(0, (length - 0.1) * 1000));
      };

      const handle: SoundHandle = {
        stop() {
          if (stopped) return;
          stopped = true;
          if (timer !== undefined) clearTimeout(timer);
          active.delete(handle);
          const now = c.currentTime;
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(master.gain.value, now);
          master.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
          setTimeout(() => master.disconnect(), FADE_SECONDS * 1000 + 50);
        },
      };

      active.add(handle);
      pass(c.currentTime + 0.01);
      return handle;
    },

    stopAll() {
      for (const handle of [...active]) handle.stop();
    },
  };
}

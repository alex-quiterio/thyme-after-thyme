# @kitchen/sounds

Kitchen clock sounds for the browser, synthesized with the Web Audio API (no audio files).

```ts
import { createKitchenSounds } from "@kitchen/sounds";

const sounds = createKitchenSounds();
button.onclick = async () => {
  await sounds.unlock();                       // once, inside a user gesture
  const ring = sounds.play("ring", { loop: true, volume: 0.9 });
  // later
  ring.stop();
};
```

Sounds: `ding`, `chime`, `alarm`, `ring`, `tick`. Browsers block audio until a user gesture, so call `unlock()` from a click/tap handler.

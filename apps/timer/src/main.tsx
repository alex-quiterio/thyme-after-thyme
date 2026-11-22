// Composition root: the only place that wires infrastructure into the layers.
import { createRoot } from "react-dom/client";
import { createTimerBoard } from "@application/timerBoard";
import { createWebAudioAlarm } from "@infrastructure/webAudioAlarm";
import { systemClock } from "@infrastructure/systemClock";
import { App } from "@ui/App";

const board = createTimerBoard({
  clock: systemClock,
  alarm: createWebAudioAlarm(),
  newId: () => crypto.randomUUID(),
});

createRoot(document.getElementById("root")!).render(<App board={board} />);

// Composition root: the only place that wires every tool's infrastructure in.
import { createRoot } from "react-dom/client";
import type { ToolDefinition } from "@shared/tool";
import { Shell } from "@shell/Shell";
import { registerServiceWorker } from "@shell/appUpdate";

import { createTimerBoard } from "@timer/application/timerBoard";
import { createDeviceAlarm } from "@timer/infrastructure/deviceAlarm";
import { createLocalStorageTimers } from "@timer/infrastructure/localStorageTimers";
import { startTicker } from "@timer/infrastructure/backgroundTicker";
import { keepAwakeWhileRunning } from "@timer/infrastructure/wakeLock";
import { systemClock } from "@timer/infrastructure/systemClock";
import { TimerTool } from "@timer/ui/TimerTool";

import { createScalerStore } from "@scaler/application/scalerStore";
import { createLocalStorageRecipe } from "@scaler/infrastructure/localStorageRecipe";
import { ScalerTool } from "@scaler/ui/ScalerTool";

import { createRecipeBook } from "@recipes/application/recipeBook";
import { bundledRecipes } from "@recipes/infrastructure/bundledRecipes";
import { createLocalStorageLibrary } from "@recipes/infrastructure/localStorageLibrary";
import { createLocalStorageProgress } from "@recipes/infrastructure/localStorageProgress";
import { RecipesTool } from "@recipes/ui/RecipesTool";

import { createRecipeTimers } from "./integrations/recipeTimers";
import { createScalerCatalog } from "./integrations/scalerCatalog";
import { createTimerBadge } from "./integrations/timerBadge";
import { BookIcon, ScaleIcon, TimerIcon } from "@shared/icons";

const newId = () => crypto.randomUUID();

const timerBoard = createTimerBoard({ clock: systemClock, alarm: createDeviceAlarm(), newId, storage: createLocalStorageTimers() });
const recipeBook = createRecipeBook({
  collections: bundledRecipes,
  timers: createRecipeTimers(timerBoard),
  library: createLocalStorageLibrary(),
  progress: createLocalStorageProgress(),
  // "Scale this recipe": the scaler is another tool, so the hand-over happens here
  scaler: {
    open(id) {
      scalerStore.pickRecipe(id);
      window.location.hash = "#/scaler";
    },
  },
});
const scalerStore = createScalerStore({ storage: createLocalStorageRecipe(), newId, catalog: createScalerCatalog(recipeBook) });

const tools: ToolDefinition[] = [
  { id: "recipes", title: { en: "Recipe book", pt: "Receitas", it: "Ricettario" }, icon: BookIcon, render: () => <RecipesTool book={recipeBook} /> },
  { id: "timer", title: { en: "Timers", pt: "Temporizadores", it: "Timer" }, icon: TimerIcon, render: () => <TimerTool board={timerBoard} />, useBadge: createTimerBadge(timerBoard) },
  { id: "scaler", title: { en: "Recipe scaler", pt: "Proporções", it: "Proporzioni" }, icon: ScaleIcon, render: () => <ScalerTool store={scalerStore} /> },
];

createRoot(document.getElementById("root")!).render(<Shell tools={tools} />);

// The clock runs for the whole app, on every tab, and catches up the moment the page is shown again.
startTicker(timerBoard.tick);
document.addEventListener("visibilitychange", timerBoard.tick);
keepAwakeWhileRunning(timerBoard);

registerServiceWorker();

// Composition root: the only place that wires every tool's infrastructure in.
import { createRoot } from "react-dom/client";
import type { ToolDefinition } from "@shared/tool";
import { Shell } from "@shell/Shell";
import { registerServiceWorker } from "@shell/appUpdate";

import { createTimerBoard } from "@timer/application/timerBoard";
import { createWebAudioAlarm } from "@timer/infrastructure/webAudioAlarm";
import { systemClock } from "@timer/infrastructure/systemClock";
import { TimerTool } from "@timer/ui/TimerTool";

import { createScalerStore } from "@scaler/application/scalerStore";
import { createLocalStorageRecipe } from "@scaler/infrastructure/localStorageRecipe";
import { ScalerTool } from "@scaler/ui/ScalerTool";

import { createRecipeBook } from "@recipes/application/recipeBook";
import { bundledRecipes } from "@recipes/infrastructure/bundledRecipes";
import { RecipesTool } from "@recipes/ui/RecipesTool";

import { createRecipeTimers } from "./integrations/recipeTimers";

const newId = () => crypto.randomUUID();

const timerBoard = createTimerBoard({ clock: systemClock, alarm: createWebAudioAlarm(), newId });
const scalerStore = createScalerStore({ storage: createLocalStorageRecipe(), newId });
const recipeBook = createRecipeBook({ collections: bundledRecipes, timers: createRecipeTimers(timerBoard) });

const tools: ToolDefinition[] = [
  { id: "recipes", title: { en: "Recipe book", pt: "Receitas", it: "Ricettario" }, emoji: "📖", render: () => <RecipesTool book={recipeBook} /> },
  { id: "timer", title: { en: "Timers", pt: "Temporizadores", it: "Timer" }, emoji: "⏲️", render: () => <TimerTool board={timerBoard} /> },
  { id: "scaler", title: { en: "Recipe scaler", pt: "Proporções", it: "Proporzioni" }, emoji: "⚖️", render: () => <ScalerTool store={scalerStore} /> },
];

createRoot(document.getElementById("root")!).render(<Shell tools={tools} />);

registerServiceWorker();

import type { RawDocument } from "@recipes/domain/recipeDocument";

export type RawRecipe = RawDocument;

export type RecipeCollection = { title: string; tagline: string | null; docs: RawRecipe[] };

export type StepTimerState = { status: "running" | "paused" | "finished"; remainingMs: number };

/**
 * Step timers live outside this tool (the Timers tool owns the clock and the alarm).
 * `key` identifies a button in a recipe, so the same step shows its own countdown.
 */
export type StepTimers = {
  start(key: string, label: string, durationMs: number): void;
  /** Cancels the timer and silences its alarm. */
  stop(key: string): void;
  subscribe(listener: () => void): () => void;
  /** Stable between changes (required by useSyncExternalStore). */
  snapshot(): Readonly<Record<string, StepTimerState>>;
};

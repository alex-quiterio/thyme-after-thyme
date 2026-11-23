import type { RawDocument } from "@recipes/domain/recipeDocument";
import type { Locale } from "@shared/locales";

export type RawRecipe = RawDocument;

export type RecipeCollection = { title: string; tagline: string | null; docs: RawRecipe[] };

export type StepTimerState = { status: "running" | "paused" | "finished"; remainingMs: number };

/**
 * Step timers live outside this tool (the Timers tool owns the clock and the alarm).
 * `key` identifies a button in a recipe, so the same step shows its own countdown.
 */
/** Sends a recipe to the scaler. The scaler is another tool, so this is wired up outside both. */
export type ScaleAction = { open(recipeId: string): void };

export type StepTimers = {
  start(key: string, label: string, durationMs: number): void;
  /** Cancels the timer and silences its alarm. */
  stop(key: string): void;
  subscribe(listener: () => void): () => void;
  /** Stable between changes (required by useSyncExternalStore). */
  snapshot(): Readonly<Record<string, StepTimerState>>;
};

/** What the user changed: recipes they imported (per language) and defaults they removed. */
export type LibraryState = {
  imported: Record<Locale, RawRecipe[]>;
  /** Recipe ids removed from the book (in every language). */
  hidden: string[];
};

/** Which ingredients and steps are ticked off, per recipe id: survives a sleeping phone or a reload. */
export type ProgressStorage = {
  load(): Record<string, string[]>;
  save(progress: Record<string, string[]>): void;
};

export type LibraryStorage = {
  load(): LibraryState;
  save(state: LibraryState): void;
};

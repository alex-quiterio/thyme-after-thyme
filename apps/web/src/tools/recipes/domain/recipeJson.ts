import { findDurations, type Duration } from "./duration";
import { assemble, plain, type Block, type Recipe, type Section } from "./recipe";

/**
 * A recipe as a JSON file. Sections list their parts in the order the author writes the keys:
 *
 *   { "title": "Tarte de amêndoa", "subtitle": "Serve 6", "number": 7,
 *     "sections": [
 *       { "title": "Ingredientes", "ingredients": ["3 ovos", "200 g de açúcar"] },
 *       { "title": "Método", "steps": [
 *           "Pré-aqueça o forno a 180 °C.",
 *           { "text": "Leve ao forno até dourar.", "timers": [{ "minutes": 25, "label": "25–30 min" }] },
 *           "Deixe arrefecer 20 minutos."          // times in the text become timers automatically
 *       ], "text": ["Dica: manteiga fria."] }
 *     ] }
 */
export type JsonTimer = { hours?: number; minutes?: number; seconds?: number; label?: string };
export type JsonStep = string | { text: string; timers?: JsonTimer[] };
export type JsonSection = { title?: string; ingredients?: string[]; steps?: JsonStep[]; text?: string | string[] };
export type JsonRecipe = { number?: number; title: string; subtitle?: string; sections: JsonSection[] };

const RECIPE_KEYS = ["number", "title", "subtitle", "sections", "$schema"];
const SECTION_KEYS = ["title", "ingredients", "steps", "text"];
const STEP_KEYS = ["text", "timers"];
const TIMER_KEYS = ["hours", "minutes", "seconds", "label"];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Parses and validates a JSON recipe. Throws an Error naming the file and the exact problem. */
export function parseRecipeJson(name: string, data: unknown): Recipe {
  const fail = (where: string, problem: string): never => {
    throw new Error(`${name}: ${where} ${problem}`);
  };
  const noUnknownKeys = (obj: Record<string, unknown>, allowed: string[], where: string) => {
    const unknown = Object.keys(obj).find((k) => !allowed.includes(k));
    if (unknown) fail(where, `has an unknown key "${unknown}" (allowed: ${allowed.join(", ")})`);
  };
  const strings = (value: unknown, where: string): string[] => {
    const list = typeof value === "string" ? [value] : value;
    if (!Array.isArray(list) || !list.every((x) => typeof x === "string" && x.trim())) fail(where, "must be a list of non-empty strings");
    return (list as string[]).map((x) => x.trim());
  };

  if (!isObject(data)) return fail("recipe", "must be a JSON object");
  noUnknownKeys(data, RECIPE_KEYS, "recipe");
  if (typeof data.title !== "string" || !data.title.trim()) fail("title", "is required (a non-empty string)");
  if (data.number !== undefined && !(Number.isInteger(data.number) && (data.number as number) >= 0)) fail("number", "must be a whole number");
  if (data.subtitle !== undefined && typeof data.subtitle !== "string") fail("subtitle", "must be a string");
  if (!Array.isArray(data.sections) || data.sections.length === 0) fail("sections", "must be a non-empty list");

  const named = name.match(/^(\d+)\s*[—–-]/);
  const number = (data.number as number | undefined) ?? (named ? Number(named[1]) : null);

  const sections: Section[] = (data.sections as unknown[]).map((raw, i) => {
    const at = `sections[${i}]`;
    if (!isObject(raw)) return fail(at, "must be an object");
    noUnknownKeys(raw, SECTION_KEYS, at);
    if (raw.title !== undefined && typeof raw.title !== "string") fail(`${at}.title`, "must be a string");
    const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : null;
    const blocks: Block[] = [];
    let method = false;

    for (const key of Object.keys(raw)) {
      const here = `${at}.${key}`;
      if (key === "ingredients") {
        blocks.push({ kind: "bullets", items: strings(raw.ingredients, here) });
      } else if (key === "text") {
        // untitled intro text describes the whole dish, so it gets no timers (same rule as markdown)
        for (const text of strings(raw.text, here)) blocks.push({ kind: "text", text, durations: title === null ? [] : findDurations(plain(text)) });
      } else if (key === "steps") {
        if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail(here, "must be a non-empty list");
        method = true;
        (raw.steps as unknown[]).forEach((step, si) => {
          const stepAt = `${here}[${si}]`;
          if (typeof step === "string") {
            if (!step.trim()) fail(stepAt, "must not be empty");
            blocks.push({ kind: "step", number: si + 1, text: step.trim(), durations: findDurations(plain(step)) });
            return;
          }
          if (!isObject(step)) return fail(stepAt, "must be a string or an object with \"text\"");
          noUnknownKeys(step, STEP_KEYS, stepAt);
          if (typeof step.text !== "string" || !step.text.trim()) fail(`${stepAt}.text`, "is required");
          const text = (step.text as string).trim();
          blocks.push({
            kind: "step",
            number: si + 1,
            text,
            durations: step.timers === undefined ? findDurations(plain(text)) : explicitTimers(step.timers, `${stepAt}.timers`, fail),
          });
        });
      }
    }
    return { title, method, blocks };
  });

  return assemble({
    name,
    number,
    title: (data.title as string).trim(),
    subtitle: typeof data.subtitle === "string" && data.subtitle.trim() ? data.subtitle.trim() : null,
    sections,
  });
}

function explicitTimers(value: unknown, where: string, fail: (where: string, problem: string) => never): Duration[] {
  if (!Array.isArray(value)) fail(where, "must be a list");
  return (value as unknown[]).map((raw, i) => {
    const at = `${where}[${i}]`;
    if (!isObject(raw)) return fail(at, "must be an object like { \"minutes\": 10 }");
    const unknown = Object.keys(raw).find((k) => !TIMER_KEYS.includes(k));
    if (unknown) fail(at, `has an unknown key "${unknown}" (allowed: ${TIMER_KEYS.join(", ")})`);
    for (const k of ["hours", "minutes", "seconds"]) {
      if (raw[k] !== undefined && !(typeof raw[k] === "number" && (raw[k] as number) >= 0)) fail(`${at}.${k}`, "must be a number");
    }
    const [h, m, s] = [raw.hours, raw.minutes, raw.seconds].map((n) => (typeof n === "number" ? n : 0)) as [number, number, number];
    const ms = Math.round((h * 3600 + m * 60 + s) * 1000);
    if (!(ms > 0)) fail(at, "needs a positive hours, minutes or seconds");
    const auto = [h && `${h} h`, m && `${m} min`, s && `${s} s`].filter(Boolean).join(" ");
    return { ms, label: typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : auto };
  });
}

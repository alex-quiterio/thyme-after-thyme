// Exports every recipe (all languages) as ONE JSON file, with explicit timers on each step.
//   bun scripts/export-recipes.ts [output.json]
// Each recipe in the file is a valid single-recipe JSON (see content/recipe.schema.json).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseDocument } from "../apps/web/src/tools/recipes/domain/recipeDocument";
import { parseRecipeJson, type JsonSection, type JsonStep, type JsonTimer } from "../apps/web/src/tools/recipes/domain/recipeJson";
import type { Recipe } from "../apps/web/src/tools/recipes/domain/recipe";
import type { Duration } from "../apps/web/src/tools/recipes/domain/duration";
import { languages, readLanguage } from "./recipe-files";

const out = resolve(process.cwd(), process.argv[2] ?? "recipes-export.json");

/**
 * Times the text only hints at in words ("a few minutes", "a minute or two"), which automatic
 * detection can't read. Keyed "recipe number:step number" and applied to the method of that recipe.
 */
const WORDED_TIMERS: Record<string, JsonTimer[]> = {
  "25:3": [{ minutes: 3, label: "~3 min" }], // "cook a few minutes until golden"
  "25:4": [{ minutes: 1, label: "1–2 min" }], // "let it bubble for a minute or two"
};

const toJsonTimer = (d: Duration): JsonTimer => {
  const label = d.label;
  if (d.ms % 3_600_000 === 0) return { hours: d.ms / 3_600_000, label };
  if (d.ms % 60_000 === 0) return { minutes: d.ms / 60_000, label };
  return { seconds: d.ms / 1000, label };
};

function toJsonRecipe(recipe: Recipe) {
  const sections: JsonSection[] = [];
  for (const section of recipe.sections) {
    let current: JsonSection & Record<string, unknown> = section.title ? { title: section.title } : {};
    const flush = () => {
      if (Object.keys(current).some((k) => k !== "title")) sections.push(current);
    };
    for (const block of section.blocks) {
      const key = block.kind === "bullets" ? "ingredients" : block.kind === "step" ? "steps" : "text";
      if (key in current && !Array.isArray(current[key])) throw new Error(`${recipe.id}: unexpected shape in "${section.title}"`);
      if (key in current && block.kind === "bullets") {
        flush(); // a second list in the same section: start a continuation of it
        current = section.title ? { title: section.title } : {};
      }
      if (block.kind === "bullets") current.ingredients = block.items;
      else if (block.kind === "text") (current.text = [...((current.text as string[] | undefined) ?? []), block.text]);
      else {
        const timers = WORDED_TIMERS[`${recipe.number}:${block.number}`]?.filter(() => section.method) ?? block.durations.map(toJsonTimer);
        const step: JsonStep = timers.length ? { text: block.text, timers } : block.text;
        current.steps = [...((current.steps as JsonStep[] | undefined) ?? []), step];
      }
    }
    flush();
  }
  return { number: recipe.number, title: recipe.title, ...(recipe.subtitle ? { subtitle: recipe.subtitle } : {}), sections };
}

const bundle: Record<string, unknown> = {};
const summary: string[] = [];
for (const lang of await languages()) {
  const book = await readLanguage(lang);
  const originals = book.docs.map(parseDocument);
  const recipes = originals.map(toJsonRecipe);

  // Verify: every exported recipe must parse back, with the same structure and the timers we expect.
  let timers = 0;
  recipes.forEach((json, i) => {
    const original = originals[i]!;
    const back = parseRecipeJson(`${String(json.number).padStart(2, "0")} — ${json.title}`, json);
    const kinds = (r: Recipe) => r.sections.flatMap((s) => s.blocks.map((b) => b.kind)).join();
    if (kinds(back) !== kinds(original)) throw new Error(`${lang}/${original.id}: structure changed in export`);
    const extra = Object.keys(WORDED_TIMERS).filter((k) => k.startsWith(`${original.number}:`)).length;
    if (back.timerCount !== original.timerCount + extra) throw new Error(`${lang}/${original.id}: timers differ (${back.timerCount} vs ${original.timerCount}+${extra})`);
    timers += back.timerCount;
  });

  bundle[lang] = { title: book.title, tagline: book.tagline, recipes };
  summary.push(`${lang}: ${recipes.length} recipes, ${timers} timers`);
}

await mkdir(dirname(out), { recursive: true });
await writeFile(
  out,
  JSON.stringify(
    {
      format: "thyme-after-thyme/recipes",
      version: 1,
      exportedAt: new Date().toISOString(),
      note: "Each entry under languages.<lang>.recipes is a single-recipe JSON (content/recipe.schema.json). Steps with a timers list start those timers; times written in a step's text are also detected automatically.",
      languages: bundle,
    },
    null,
    2,
  ) + "\n",
);
console.log(`exported to ${out}\n  ${summary.join("\n  ")}`);

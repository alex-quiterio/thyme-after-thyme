// Every recipe must have the same shape in every language: same files, sections, bullets,
// steps and timers. Step timers are keyed by position, so a drifting translation breaks them.
import { parseDocument } from "../apps/web/src/tools/recipes/domain/recipeDocument";
import type { Recipe } from "../apps/web/src/tools/recipes/domain/recipe";
import { languages, readLanguage } from "./recipe-files";

const REFERENCE = "pt";

async function load(lang: string): Promise<Map<number, Recipe>> {
  const out = new Map<number, Recipe>();
  for (const doc of (await readLanguage(lang)).docs) {
    const recipe = parseDocument(doc);
    if (recipe.number === null) throw new Error(`${lang}/${doc.name}: recipes need a number (file name "07 — Title" or "number" in JSON)`);
    out.set(recipe.number, recipe);
  }
  return out;
}

/** The structure that must match across languages. */
const shape = (r: Recipe) =>
  r.sections.map((s) =>
    s.blocks
      .map((b) => (b.kind === "bullets" ? `bullets×${b.items.length}` : `${b.kind}[${b.durations.map((d) => d.label).join(",")}]`))
      .join(" "),
  );

const all = await languages();
const reference = await load(REFERENCE);
const problems: string[] = [];

for (const lang of all.filter((l) => l !== REFERENCE)) {
  const recipes = await load(lang);
  for (const n of reference.keys()) if (!recipes.has(n)) problems.push(`${lang}: missing recipe ${String(n).padStart(2, "0")}`);
  for (const n of recipes.keys()) if (!reference.has(n)) problems.push(`${lang}: recipe ${String(n).padStart(2, "0")} has no ${REFERENCE} original`);

  for (const [n, ref] of reference) {
    const other = recipes.get(n);
    if (!other) continue;
    const a = shape(ref);
    const b = shape(other);
    const id = String(n).padStart(2, "0");
    if (a.length !== b.length) {
      problems.push(`${lang}/${id}: ${b.length} sections, ${REFERENCE} has ${a.length}`);
      continue;
    }
    a.forEach((section, i) => {
      if (section !== b[i]) problems.push(`${lang}/${id} section ${i + 1} (“${other.sections[i]?.title ?? ""}”): ${b[i]}\n      ${REFERENCE} has: ${section}`);
    });
  }
}

if (problems.length) {
  console.error(`Translation check failed:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`translations: ${all.join(", ")} are consistent (${reference.size} recipes each)`);

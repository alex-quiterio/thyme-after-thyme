// Every recipe must have the same shape in every language: same files, sections, bullets,
// steps and timers. Step timers are keyed by position, so a drifting translation breaks them.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseRecipe, type Recipe } from "../apps/web/src/tools/recipes/domain/recipe";

const content = join(import.meta.dir, "..", "content", "recipes");
const REFERENCE = "pt";

async function load(lang: string): Promise<Map<number, Recipe>> {
  const dir = join(content, lang);
  const out = new Map<number, Recipe>();
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".md"))) {
    const name = f.normalize("NFC").replace(/\.md$/, "");
    const recipe = parseRecipe(name, await readFile(join(dir, f), "utf8"));
    if (recipe.number === null) throw new Error(`${lang}/${f}: file names must start with a number ("07 — Title")`);
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

const languages = (await readdir(content, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
const reference = await load(REFERENCE);
const problems: string[] = [];

for (const lang of languages.filter((l) => l !== REFERENCE)) {
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
console.log(`translations: ${languages.join(", ")} are consistent (${reference.size} recipes each)`);

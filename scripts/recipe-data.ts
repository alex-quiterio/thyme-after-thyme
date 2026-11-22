// Bundles recipes (markdown and JSON, per language) into one JSON module the app imports.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { languages, readLanguage, recipesDir } from "./recipe-files";

const target = join(import.meta.dir, "..", "apps", "web", "src", "tools", "recipes", "infrastructure", "recipes.generated.json");

const locales: Record<string, unknown> = {};
for (const lang of await languages()) {
  const book = await readLanguage(lang);
  locales[lang] = book;
  const json = book.docs.filter((d) => "json" in d).length;
  console.log(`recipes: ${lang} ${book.docs.length} documents (${json} JSON)`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ locales }, null, 1));
console.log(`recipes: read from ${recipesDir}`);

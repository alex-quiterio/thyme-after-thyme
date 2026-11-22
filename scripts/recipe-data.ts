// Bundles content/recipes/<lang>/*.md (+ _book.json) into one JSON module the app imports.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = join(import.meta.dir, "..");
const content = join(root, "content", "recipes");
const target = join(root, "apps", "web", "src", "tools", "recipes", "infrastructure", "recipes.generated.json");

const languages = (await readdir(content, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
const locales: Record<string, unknown> = {};

for (const lang of languages) {
  const dir = join(content, lang);
  const book = JSON.parse(await readFile(join(dir, "_book.json"), "utf8")) as { title: string; tagline?: string };
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort((a, b) => a.localeCompare(b));
  const docs = await Promise.all(
    files.map(async (f) => ({ name: f.normalize("NFC").replace(/\.md$/, ""), markdown: await readFile(join(dir, f), "utf8") })),
  );
  locales[lang] = { title: book.title, tagline: book.tagline ?? null, docs };
  console.log(`recipes: ${lang} ${docs.length} documents`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ locales }, null, 1));

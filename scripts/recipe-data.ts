// Bundles content/recipes/*.md (+ _book.json) into one JSON module the app imports.
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = join(import.meta.dir, "..");
const source = join(root, "content", "recipes");
const target = join(root, "apps", "web", "src", "tools", "recipes", "infrastructure", "recipes.generated.json");

const book = JSON.parse(await readFile(join(source, "_book.json"), "utf8")) as { title: string; tagline?: string };
const files = (await readdir(source)).filter((f) => f.endsWith(".md")).sort((a, b) => a.localeCompare(b));

const docs = await Promise.all(
  files.map(async (f) => ({
    name: f.normalize("NFC").replace(/\.md$/, ""),
    markdown: await readFile(join(source, f), "utf8"),
  })),
);

await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ title: book.title, tagline: book.tagline ?? null, docs }, null, 1));
console.log(`recipes: bundled ${docs.length} documents`);

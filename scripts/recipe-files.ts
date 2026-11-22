// Reads recipe files (markdown or JSON) from content folders. Shared by the bundler and the checker.
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseDocument, type RawDocument } from "../apps/web/src/tools/recipes/domain/recipeDocument";

/** Where the recipes live. Point RECIPES_DIR at another folder (with pt/en/it inside) to use it instead. */
export const recipesDir = process.env.RECIPES_DIR
  ? resolve(process.cwd(), process.env.RECIPES_DIR)
  : join(import.meta.dir, "..", "content", "recipes");

export async function languages(): Promise<string[]> {
  return (await readdir(recipesDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

export type Book = { title: string; tagline: string | null; docs: RawDocument[] };

/** One language folder: _book.json for the cover, then every *.md and *.json recipe (files starting with "_" are skipped). */
export async function readLanguage(lang: string): Promise<Book> {
  const dir = join(recipesDir, lang);
  const book = JSON.parse(await readFile(join(dir, "_book.json"), "utf8")) as { title: string; tagline?: string };
  const files = (await readdir(dir)).filter((f) => !f.startsWith("_") && /\.(md|json)$/.test(f)).sort((a, b) => a.localeCompare(b));

  const docs: RawDocument[] = [];
  const seen = new Map<string, string>();
  for (const f of files) {
    const name = f.normalize("NFC").replace(/\.(md|json)$/, "");
    const text = await readFile(join(dir, f), "utf8");
    let doc: RawDocument;
    if (f.endsWith(".json")) {
      try {
        doc = { name, json: JSON.parse(text) };
      } catch (e) {
        throw new Error(`${lang}/${f}: not valid JSON (${(e as Error).message})`);
      }
    } else {
      doc = { name, markdown: text };
    }

    let id: string;
    try {
      id = parseDocument(doc).id; // validates now, so mistakes fail the build instead of the browser
    } catch (e) {
      throw new Error(`${lang}/${f}: ${(e as Error).message.replace(`${name}: `, "")}`);
    }
    const clash = seen.get(id);
    if (clash) throw new Error(`${lang}: "${f}" and "${clash}" are both recipe ${id}; keep one`);
    seen.set(id, f);
    docs.push(doc);
  }
  return { title: book.title, tagline: book.tagline ?? null, docs };
}

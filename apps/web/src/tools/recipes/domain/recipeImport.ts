import { isLocale, locales, type Locale } from "@shared/locales";
import { parseDocument, type RawDocument } from "./recipeDocument";

/** The `format` value of a full export (see scripts/export-recipes.ts). */
export const BUNDLE_FORMAT = "thyme-after-thyme/recipes";

export type ImportedDoc = {
  /** Language the file says it is in (full exports do), or null when it doesn't say. */
  locale: Locale | null;
  doc: RawDocument;
};
export type ImportRead = { docs: ImportedDoc[]; errors: string[] };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const pad = (n: number) => String(n).padStart(2, "0");

/** "07 — Title" when the recipe is numbered, so the number becomes its id. */
function nameFor(recipe: Record<string, unknown>, fallback: string): string {
  if (/^\d+\s*[—–-]/.test(fallback)) return fallback;
  const title = typeof recipe.title === "string" && recipe.title.trim() ? recipe.title.trim() : fallback;
  return Number.isInteger(recipe.number) ? `${pad(recipe.number as number)} — ${title}` : title;
}

/**
 * Reads one file the user picked. Accepts:
 *  - a single recipe JSON ({ title, sections })
 *  - a list of recipes
 *  - a full export ({ format: "thyme-after-thyme/recipes", languages: { pt: { recipes: [...] }, ... } })
 *  - a Markdown recipe
 * Problems are reported per recipe in `errors`; valid recipes in the same file still come through.
 */
export function readImportFile(fileName: string, text: string): ImportRead {
  const stem = fileName.replace(/\.[^.]+$/, "");
  const docs: ImportedDoc[] = [];
  const errors: string[] = [];

  const add = (locale: Locale | null, doc: RawDocument, where: string) => {
    try {
      if (parseDocument(doc).sections.length === 0) throw new Error(`${doc.name}: has no recipe content`);
      docs.push({ locale, doc });
    } catch (e) {
      errors.push(`${where}: ${(e as Error).message.replace(`${doc.name}: `, "")}`);
    }
  };

  if (/\.(md|markdown)$/i.test(fileName)) {
    add(null, { name: stem, markdown: text }, fileName);
    return { docs, errors };
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { docs, errors: [`${fileName}: not valid JSON`] };
  }

  if (isObject(data) && data.format === BUNDLE_FORMAT && isObject(data.languages)) {
    for (const [lang, book] of Object.entries(data.languages)) {
      if (!isLocale(lang)) {
        errors.push(`${fileName}: unknown language "${lang}" (use ${locales.join(", ")})`);
        continue;
      }
      const list = isObject(book) && Array.isArray(book.recipes) ? book.recipes : [];
      list.forEach((r: unknown, i: number) => {
        const where = `${fileName} › ${lang} #${i + 1}`;
        if (!isObject(r)) errors.push(`${where}: must be a recipe object`);
        else add(lang, { name: nameFor(r, `${lang}-${i + 1}`), json: r }, where);
      });
    }
  } else if (Array.isArray(data)) {
    data.forEach((r, i) => {
      const where = `${fileName} #${i + 1}`;
      if (!isObject(r)) errors.push(`${where}: must be a recipe object`);
      else add(null, { name: nameFor(r, `${stem}-${i + 1}`), json: r }, where);
    });
  } else if (isObject(data) && "sections" in data) {
    add(null, { name: nameFor(data, stem), json: data }, fileName);
  } else {
    errors.push(`${fileName}: not a recipe file (expected a recipe with "title" and "sections", or a full export)`);
  }
  return { docs, errors };
}

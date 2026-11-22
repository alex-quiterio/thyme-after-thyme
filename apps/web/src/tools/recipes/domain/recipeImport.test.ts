import { describe, expect, test } from "bun:test";
import { parseDocument } from "./recipeDocument";
import { BUNDLE_FORMAT, readImportFile } from "./recipeImport";

const recipe = { number: 26, title: "Tomato toast", sections: [{ title: "Method", steps: ["Toast for 3 minutes."] }] };

describe("readImportFile", () => {
  test("a single recipe JSON; the number becomes its id", () => {
    const r = readImportFile("toast.json", JSON.stringify(recipe));
    expect(r.errors).toEqual([]);
    expect(r.docs).toHaveLength(1);
    expect(r.docs[0]?.locale).toBeNull();
    expect(parseDocument(r.docs[0]!.doc)).toMatchObject({ id: "26", title: "Tomato toast", timerCount: 1 });
  });

  test("an unnumbered recipe gets an id from its title or file name", () => {
    const r = readImportFile("x.json", JSON.stringify({ title: "Plain bread", sections: [{ ingredients: ["flour"] }] }));
    expect(parseDocument(r.docs[0]!.doc).id).toBe("plain-bread");
  });

  test("a full export goes to the languages it names; one bad recipe doesn't stop the rest", () => {
    const bundle = {
      format: BUNDLE_FORMAT,
      languages: { en: { recipes: [recipe, { title: "Broken", sections: [{ step: ["x"] }] }] }, it: { recipes: [{ ...recipe, title: "Toast" }] }, xx: { recipes: [] } },
    };
    const r = readImportFile("all.json", JSON.stringify(bundle));
    expect(r.docs.map((d) => d.locale)).toEqual(["en", "it"]);
    expect(r.errors).toHaveLength(2);
    expect(r.errors[0]).toContain('all.json › en #2: sections[0] has an unknown key "step"');
    expect(r.errors[1]).toContain('unknown language "xx"');
  });

  test("a list of recipes, and markdown", () => {
    expect(readImportFile("many.json", JSON.stringify([recipe, { ...recipe, number: 27 }])).docs).toHaveLength(2);
    const md = readImportFile("12 — Soup.md", "# Soup\n\n## Method\n\nSimmer 20 minutes.\n");
    expect(parseDocument(md.docs[0]!.doc)).toMatchObject({ id: "12", title: "Soup", timerCount: 1 });
  });

  test("clear errors for things that aren't recipes", () => {
    expect(readImportFile("a.json", "{nope").errors).toEqual(["a.json: not valid JSON"]);
    expect(readImportFile("a.json", '{"hello":1}').errors[0]).toContain("not a recipe file");
    expect(readImportFile("empty.md", "   ").errors[0]).toContain("no recipe content");
    expect(readImportFile("a.json", '"text"').errors[0]).toContain("not a recipe file");
  });
});

import { describe, expect, test } from "bun:test";
import { parseDocument } from "./recipeDocument";
import { parseRecipe } from "./recipe";
import { parseRecipeJson } from "./recipeJson";

const json = {
  number: 7,
  title: "Tarte de amêndoa",
  subtitle: "Serve 6",
  sections: [
    { title: "Ingredientes", ingredients: ["3 ovos", "200 g de açúcar"] },
    {
      title: "Método",
      steps: [
        "Pré-aqueça o forno a 180 °C.",
        { text: "Leve ao forno até dourar.", timers: [{ minutes: 25, label: "25–30 min" }] },
        "Deixe arrefecer 20 minutos.",
      ],
      text: ["**Dica:** manteiga fria."],
    },
  ],
};

describe("JSON recipes", () => {
  const r = parseRecipeJson("07 — Tarte de amêndoa", json);

  test("same model as a markdown recipe", () => {
    const md = parseRecipe("07 — Tarte de amêndoa", "# Tarte\n\n*Serve 6*\n\n## Ingredientes\n\n  - 3 ovos\n  - 200 g de açúcar\n\n## Método\n\nPré-aqueça o forno a 180 °C.\n\nLeve ao forno até dourar.\n\nDeixe arrefecer 20 minutos.\n");
    expect(r).toMatchObject({ id: "07", number: 7, title: "Tarte de amêndoa", subtitle: "Serve 6", kind: "recipe" });
    expect(r.sections.map((s) => s.blocks.map((b) => b.kind))).toEqual([["bullets"], ["step", "step", "step", "text"]]);
    expect(md.sections[0]).toEqual(r.sections[0]);
  });

  test("explicit timers win; others are detected from the text", () => {
    const steps = r.sections[1]!.blocks;
    expect(steps[1]).toMatchObject({ durations: [{ ms: 1_500_000, label: "25–30 min" }] });
    expect(steps[2]).toMatchObject({ durations: [{ ms: 1_200_000, label: "20 min" }] });
    expect(r.timerCount).toBe(2);
  });

  test("timer labels are computed when not given", () => {
    const x = parseRecipeJson("x", { title: "X", sections: [{ title: "Método", steps: [{ text: "Espere.", timers: [{ hours: 1, minutes: 30 }, { seconds: 45 }] }] }] });
    const step = x.sections[0]!.blocks[0];
    expect(step).toMatchObject({ durations: [{ ms: 5_400_000, label: "1 h 30 min" }, { ms: 45_000, label: "45 s" }] });
  });

  test("parts appear in the order the keys are written", () => {
    const x = parseRecipeJson("x", { title: "X", sections: [{ title: "Molho", ingredients: ["sal"], text: "Misture e deixe repousar 10 minutos." }] });
    expect(x.sections[0]!.blocks.map((b) => b.kind)).toEqual(["bullets", "text"]);
    expect(x.timerCount).toBe(1);
    expect(x.kind).toBe("note");
  });

  test("the number can come from the file name, and parseDocument dispatches on the format", () => {
    expect(parseRecipeJson("12 — Qualquer", { title: "Q", sections: [{ ingredients: ["a"] }] }).id).toBe("12");
    expect(parseDocument({ name: "07 — T", json }).id).toBe("07");
    expect(parseDocument({ name: "07 — T", markdown: "# T\n" }).title).toBe("T");
  });

  test("mistakes are reported with the exact place", () => {
    const bad = (data: unknown) => () => parseRecipeJson("f", data);
    expect(bad("nope")).toThrow("f: recipe must be a JSON object");
    expect(bad({ sections: [{}] })).toThrow("title is required");
    expect(bad({ title: "T", sections: [] })).toThrow("sections must be a non-empty list");
    expect(bad({ title: "T", sections: [{ step: ["x"] }] })).toThrow('sections[0] has an unknown key "step"');
    expect(bad({ title: "T", sections: [{ steps: ["ok", { txt: "x" }] }] })).toThrow('sections[0].steps[1] has an unknown key "txt"');
    expect(bad({ title: "T", sections: [{ steps: [{ text: "x", timers: [{ minutes: 0 }] }] }] })).toThrow("needs a positive");
    expect(bad({ title: "T", sections: [{ ingredients: [1] }] })).toThrow("sections[0].ingredients must be a list of non-empty strings");
  });
});

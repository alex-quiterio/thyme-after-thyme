import { describe, expect, test } from "bun:test";
import { findDurations } from "./duration";
import { matchesQuery, parseRecipe } from "./recipe";

describe("findDurations", () => {
  test("single values, ranges and units in Portuguese and English", () => {
    expect(findDurations("cozinhe 5–7 minutos")).toEqual([{ ms: 300_000, label: "5–7 min" }]);
    expect(findDurations("cerca de 1 minuto")).toEqual([{ ms: 60_000, label: "1 min" }]);
    expect(findDurations("Cozinhe 30 segundos.")).toEqual([{ ms: 30_000, label: "30 s" }]);
    expect(findDurations("pelo menos 2–3 horas")).toEqual([{ ms: 7_200_000, label: "2–3 h" }]);
    expect(findDurations("Simmer 20 min")).toEqual([{ ms: 1_200_000, label: "20 min" }]);
    expect(findDurations("Cook a few minutes")).toEqual([]);
  });

  test("ignores temperatures, quantities and lookalike words", () => {
    expect(findDurations("a 180–190 °C durante 35–45 minutos")).toEqual([{ ms: 2_100_000, label: "35–45 min" }]);
    expect(findDurations("2 c. de sopa de azeite, 3 hortelã, 200 g")).toEqual([]);
  });

  test("Italian units", () => {
    expect(findDurations("cuoci 5–7 minuti").map((d) => d.label)).toEqual(["5–7 min"]);
    expect(findDurations("cuoci 1 minuto e 30 secondi").map((d) => d.ms)).toEqual([60_000, 30_000]);
    expect(findDurations("in frigorifero per 2–3 ore")).toEqual([{ ms: 7_200_000, label: "2–3 h" }]);
    expect(findDurations("ci vuole ora")).toEqual([]);
  });

  test("several spans in one step", () => {
    expect(findDurations("2–3 minutos de cada lado, depois 1 minuto").map((d) => d.label)).toEqual(["2–3 min", "1 min"]);
  });
});

const doc = `# **Tarte**

*Serve 4*

## **Ingredientes**

  - 3 ovos
  - 200 g de açúcar

## **Método**

Pré-aqueça o forno a 180 °C.

Leve ao forno 25–30 minutos.

**Dica: manteiga fria.**
`;

describe("parseRecipe", () => {
  const r = parseRecipe("07 — Tarte de amêndoa", doc);

  test("title and number come from the document name", () => {
    expect(r).toMatchObject({ id: "07", number: 7, title: "Tarte de amêndoa", subtitle: "Serve 4", kind: "recipe" });
  });

  test("bullets, numbered steps, tips and timers", () => {
    const [ingredients, method] = r.sections;
    expect(ingredients).toMatchObject({ title: "Ingredientes", blocks: [{ kind: "bullets", items: ["3 ovos", "200 g de açúcar"] }] });
    expect(method?.method).toBe(true);
    expect(method?.blocks.map((b) => b.kind)).toEqual(["step", "step", "text"]);
    expect(method?.blocks[1]).toMatchObject({ number: 2, durations: [{ label: "25–30 min" }] });
    expect(r.timerCount).toBe(1);
  });

  test("nested method headings and numbered steps", () => {
    const sopa = parseRecipe("23 — Sopa", "# Sopa\n\n## **Método 1: Base**\n\n### **Ingredientes**\n\n  - Batatas\n\n### **Preparação**\n\n1.  Coza 10 minutos.\n2.  Triture.\n");
    expect(sopa.sections.map((s) => [s.title, s.method])).toEqual([
      ["Método 1: Base · Ingredientes", false],
      ["Método 1: Base · Preparação", true],
    ]);
    expect(sopa.sections[1]?.blocks).toMatchObject([{ kind: "step", number: 1 }, { kind: "step", number: 2 }]);
  });

  test("bold labels followed by lists become sections; no method means a note", () => {
    const juices = parseRecipe("24 — Sumos", "**Sumo Amarelo**\n\n  - 1 maçã\n\n**Sumo Verde**\n\n  - kiwi\n");
    expect(juices.kind).toBe("note");
    expect(juices.sections.map((s) => s.title)).toEqual(["Sumo Amarelo", "Sumo Verde"]);
  });

  test("an intro paragraph before any heading is kept", () => {
    const oyster = parseRecipe("Oyster", "# Oyster\n\nA one-pan braise.\n\n## Cook\n\n1.  Fry.\n");
    expect(oyster.number).toBeNull();
    expect(oyster.sections[0]).toMatchObject({ title: null, blocks: [{ kind: "text", text: "A one-pan braise." }] });
    const timed = parseRecipe("X", "# X\n\nA braise, about 20 minutes.\n\n## Cook\n\n1.  Fry 5 minutes.\n");
    expect(timed.timerCount).toBe(1); // the step's 5 minutes, not the intro's total time
  });
});

test("search matches accent-insensitively on all words", () => {
  const r = parseRecipe("07 — Tarte de amêndoa", doc);
  expect(matchesQuery(r, "amendoa")).toBe(true);
  expect(matchesQuery(r, "tarte acucar")).toBe(true);
  expect(matchesQuery(r, "tarte chocolate")).toBe(false);
  expect(matchesQuery(r, "")).toBe(true);
});

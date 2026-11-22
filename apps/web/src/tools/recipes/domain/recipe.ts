import { findDurations, type Duration } from "./duration";

export type Block =
  | { kind: "bullets"; items: string[] }
  | { kind: "text"; text: string; durations: Duration[] }
  | { kind: "step"; number: number; text: string; durations: Duration[] };

export type Section = { title: string | null; method: boolean; blocks: Block[] };

export type Recipe = {
  id: string;
  /** From the "07 — ..." prefix of the document name. */
  number: number | null;
  title: string;
  subtitle: string | null;
  sections: Section[];
  /** "recipe" has a method section; everything else is a "note" (intro, sauces, essays). */
  kind: "recipe" | "note";
  timerCount: number;
  /** Folded text used by search: title plus ingredients. */
  searchText: string;
};

/** Lowercase and strip accents so "cafe" finds "café". */
export const fold = (s: string): string =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export const slugify = (s: string): string =>
  fold(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const unescape = (s: string) => s.replace(/\\([\\[\]\-*_])/g, "$1");
/** Text with markdown emphasis markers removed. */
export const plain = (s: string) => unescape(s).replace(/\*+/g, "");
const heading = (s: string) => plain(s).replace(/^[-\s]+/, "").trim();

const METHOD = /^(metodo|preparacao|preparazione|procedimento|cozinhar|cottura|cook|method|preparation)/;
const isMethodTitle = (title: string) => METHOD.test(fold(title.split(" · ").pop() ?? ""));

const nextIsBullet = (lines: string[], from: number) => {
  for (let i = from + 1; i < lines.length; i++) {
    if (lines[i]!.trim()) return /^\s*[-*]\s+/.test(lines[i]!);
  }
  return false;
};

/** Parses one document ("07 — Tarte de amêndoa" + its markdown) into a recipe. */
export function parseRecipe(name: string, markdown: string): Recipe {
  const named = name.match(/^(\d+)\s*[—–-]\s*(.+)$/);
  const number = named ? Number(named[1]) : null;
  const title = (named ? named[2]! : name).trim();

  const sections: Section[] = [];
  let current: Section | null = null;
  let parent: string | null = null;
  let subtitle: string | null = null;
  let sawTitle = false;

  const open = (raw: string, level: number) => {
    let sectionTitle = raw;
    if (level >= 3 && parent) {
      // an empty parent heading ("Método 1") becomes a prefix of its children instead of a section
      if (current && current.title === parent && current.blocks.length === 0) sections.pop();
      sectionTitle = `${parent} · ${raw}`;
    } else if (level <= 2) {
      parent = raw;
    }
    current = { title: sectionTitle, method: isMethodTitle(sectionTitle), blocks: [] };
    sections.push(current);
  };
  const ensure = (): Section => {
    if (!current) {
      current = { title: null, method: false, blocks: [] };
      sections.push(current);
    }
    return current;
  };

  const lines = markdown.replace(/\r/g, "").split("\n");
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line || /^-{3,}$/.test(line)) return;

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      if (h[1]!.length === 1 && !sawTitle && sections.length === 0) sawTitle = true; // document title: the file name wins
      else open(heading(h[2]!), Math.max(h[1]!.length, 2));
      return;
    }

    const boldOnly = line.match(/^\*\*([^*]+)\*\*$/);
    if (boldOnly && nextIsBullet(lines, i)) return open(heading(boldOnly[1]!), 2);

    const bullet = raw.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      const section = ensure();
      const last = section.blocks.at(-1);
      const item = unescape(bullet[1]!.trim());
      if (last?.kind === "bullets") last.items.push(item);
      else section.blocks.push({ kind: "bullets", items: [item] });
      return;
    }

    const numbered = line.match(/^(\d+)\.\s+(.*)$/);
    const italic = line.match(/^\*([^*].*[^*])\*$/);
    if (italic && !numbered && sections.length === 0 && subtitle === null) {
      subtitle = plain(italic[1]!);
      return;
    }

    const section = ensure();
    const text = unescape((numbered ? numbered[2]! : line).trim());
    // intro text ('about 20 minutes' in total) describes the whole dish, not a step
    const durations = section.title === null ? [] : findDurations(plain(text));
    const isStep = numbered !== null || (section.method && !boldOnly);
    if (isStep) {
      const number = section.blocks.filter((b) => b.kind === "step").length + 1;
      section.blocks.push({ kind: "step", number, text, durations });
    } else {
      section.blocks.push({ kind: "text", text, durations });
    }
  });

  return assemble({ name, number, title, subtitle, sections });
}

/** Builds the final recipe from parsed parts. Shared by the markdown and JSON readers. */
export function assemble(parts: {
  name: string;
  number: number | null;
  title: string;
  subtitle: string | null;
  sections: Section[];
}): Recipe {
  const { name, number, title, subtitle, sections } = parts;
  const blocks = sections.flatMap((s) => s.blocks);
  const bulletText = blocks.flatMap((b) => (b.kind === "bullets" ? b.items : []));
  return {
    // numbered documents share an id across languages, so switching language keeps you on the same recipe
    id: number !== null ? String(number).padStart(2, "0") : slugify(name),
    number,
    title,
    subtitle,
    sections,
    kind: sections.some((s) => s.method) ? "recipe" : "note",
    timerCount: blocks.reduce((n, b) => n + (b.kind === "bullets" ? 0 : b.durations.length), 0),
    searchText: fold([title, subtitle ?? "", ...sections.map((s) => s.title ?? ""), ...bulletText].join(" ")),
  };
}

/** Every word of the query must appear in the title or ingredients. */
export function matchesQuery(recipe: Recipe, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean);
  return words.every((w) => recipe.searchText.includes(w));
}

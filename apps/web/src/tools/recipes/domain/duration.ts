export type Duration = {
  /** Timer length. For a range ("5–7 minutos") this is the lower bound: check at the early end. */
  ms: number;
  /** Short label for a button: "5–7 min", "30 s", "2–3 h". */
  label: string;
};

const UNITS: Array<[pattern: string, abbr: string, ms: number]> = [
  ["segundos?|seconds?", "s", 1_000],
  ["minutos?|minutes?|min", "min", 60_000],
  ["horas?|hours?|h", "h", 3_600_000],
];

const NUMBER = "\\d+(?:[.,]\\d+)?";
const UNIT_ALTERNATION = UNITS.map(([p]) => p).join("|");
// number [– number] unit, where the unit is a whole word ("2 h" yes, "2 hortelã" no)
const PATTERN = `(${NUMBER})(?:\\s*[–-]\\s*(${NUMBER}))?\\s*(${UNIT_ALTERNATION})(?![\\p{L}])`;

const toNumber = (s: string) => Number(s.replace(",", "."));

/** Finds every time span in a piece of text ("cozinhe 5–7 minutos", "bake 20 min"). */
export function findDurations(text: string): Duration[] {
  const found: Duration[] = [];
  for (const m of text.matchAll(new RegExp(PATTERN, "giu"))) {
    const [, from, to, unit] = m;
    const spec = UNITS.find(([p]) => new RegExp(`^(?:${p})$`, "i").test(unit!));
    const low = toNumber(from!);
    if (!spec || !(low > 0)) continue;
    found.push({
      ms: Math.round(low * spec[2]),
      label: `${from}${to ? `–${to}` : ""} ${spec[1]}`,
    });
  }
  return found;
}

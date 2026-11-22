/**
 * Sound recipes: each one schedules Web Audio nodes starting at `t0`
 * and returns how long (seconds) one pass lasts. Everything is synthesized,
 * so there are no audio assets to ship or license.
 */
export type SoundName = "ding" | "chime" | "alarm" | "ring" | "tick";

export type Recipe = (ctx: AudioContext, out: AudioNode, t0: number) => number;

/** One enveloped oscillator note. */
function note(
  ctx: AudioContext,
  out: AudioNode,
  t0: number,
  freq: number,
  opts: { type?: OscillatorType; peak?: number; attack?: number; decay: number },
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const { type = "sine", peak = 0.5, attack = 0.005, decay } = opts;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  osc.connect(gain).connect(out);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.05);
}

/** Bell strike: fundamental plus inharmonic partials, like a service bell. */
function bell(ctx: AudioContext, out: AudioNode, t0: number, freq: number, decay: number): void {
  const partials: Array<[ratio: number, level: number, decayScale: number]> = [
    [1, 0.5, 1],
    [2.76, 0.25, 0.6],
    [5.4, 0.12, 0.35],
    [8.93, 0.06, 0.2],
  ];
  for (const [ratio, level, scale] of partials) {
    note(ctx, out, t0, freq * ratio, { peak: level, decay: decay * scale });
  }
}

/** Single service-bell "ding". */
const ding: Recipe = (ctx, out, t0) => {
  bell(ctx, out, t0, 880, 1.6);
  return 1.8;
};

/** Three ascending bell notes, gentle "your food is ready". */
const chime: Recipe = (ctx, out, t0) => {
  [659.25, 783.99, 987.77].forEach((f, i) => bell(ctx, out, t0 + i * 0.28, f, 1.1));
  return 2.0;
};

/** Digital oven alarm: four quick beeps, a pause, repeat. */
const alarm: Recipe = (ctx, out, t0) => {
  for (let i = 0; i < 4; i++) {
    note(ctx, out, t0 + i * 0.18, 2000, { type: "square", peak: 0.18, attack: 0.004, decay: 0.09 });
  }
  return 1.2;
};

/** Wind-up egg timer: a hammer rapidly alternating between two bells. */
const ring: Recipe = (ctx, out, t0) => {
  const strikes = 24;
  for (let i = 0; i < strikes; i++) {
    const f = i % 2 === 0 ? 1760 : 2093;
    note(ctx, out, t0 + i * 0.045, f, { type: "triangle", peak: 0.3, attack: 0.002, decay: 0.07 });
  }
  return strikes * 0.045 + 0.6;
};

/** Mechanical clock tick: a short band-passed noise click. */
const tick: Recipe = (ctx, out, t0) => {
  const length = Math.floor(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3200;
  filter.Q.value = 1.2;
  const gain = ctx.createGain();
  gain.gain.value = 0.7;
  src.connect(filter).connect(gain).connect(out);
  src.start(t0);
  return 1;
};

export const recipes: Record<SoundName, Recipe> = { ding, chime, alarm, ring, tick };

export const soundNames = Object.keys(recipes) as SoundName[];

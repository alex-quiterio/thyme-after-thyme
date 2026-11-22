import { describe, expect, test } from "bun:test";
import { createKitchenSounds } from "./player";
import { soundNames } from "./recipes";

/** Minimal AudioContext stand-in that records created nodes. */
function fakeContext() {
  const created: string[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  });
  const node = (kind: string) => {
    created.push(kind);
    const n: any = { connect: (x: any) => x, disconnect() {}, start() {}, stop() {} };
    n.gain = param();
    n.frequency = param();
    n.Q = param();
    return n;
  };
  const ctx: any = {
    state: "suspended",
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: async () => void (ctx.state = "running"),
    createGain: () => node("gain"),
    createOscillator: () => node("osc"),
    createBiquadFilter: () => node("filter"),
    createBufferSource: () => node("buffer"),
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
  };
  return { ctx: ctx as AudioContext, created };
}

describe("createKitchenSounds", () => {
  test("unlock resumes a suspended context", async () => {
    const { ctx } = fakeContext();
    await createKitchenSounds({ audioContext: ctx }).unlock();
    expect(ctx.state).toBe("running");
  });

  test("every sound schedules audio nodes", () => {
    for (const name of soundNames) {
      const { ctx, created } = fakeContext();
      const h = createKitchenSounds({ audioContext: ctx }).play(name);
      expect(created.length).toBeGreaterThan(1);
      h.stop();
    }
  });

  test("stop is idempotent and stopAll clears loops", () => {
    const { ctx } = fakeContext();
    const sounds = createKitchenSounds({ audioContext: ctx });
    const a = sounds.play("ring", { loop: true });
    sounds.play("alarm", { loop: true });
    a.stop();
    a.stop();
    sounds.stopAll();
  });
});

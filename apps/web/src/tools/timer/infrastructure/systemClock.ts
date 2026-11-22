import type { Clock } from "@timer/application/ports";

export const systemClock: Clock = { now: () => Date.now() };

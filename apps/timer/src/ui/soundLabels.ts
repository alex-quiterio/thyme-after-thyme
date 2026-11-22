import type { AlarmSound } from "@domain/timer";

export const soundLabels: Record<AlarmSound, string> = {
  ring: "Egg-timer ring",
  alarm: "Oven beeps",
  ding: "Service bell",
  chime: "Dinner chime",
};

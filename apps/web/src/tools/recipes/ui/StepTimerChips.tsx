import type { Duration } from "@recipes/domain/duration";
import type { StepTimers, StepTimerState } from "@recipes/application/ports";
import { formatClock } from "@shared/formatClock";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

type Props = {
  timers: StepTimers;
  states: Readonly<Record<string, StepTimerState>>;
  keyPrefix: string;
  durations: Duration[];
  label: string;
};

export function StepTimerChips({ timers, states, keyPrefix, durations, label }: Props) {
  const m = useMessages(messages);
  if (durations.length === 0) return null;
  return (
    <div className="chips">
      {durations.map((d, i) => {
        const key = `${keyPrefix}:${i}`;
        const state = states[key];
        const name = `${label} (${d.label})`;

        if (!state) {
          return (
            <button key={key} className="chip" onClick={() => timers.start(key, name, d.ms)}>
              <span aria-hidden="true">⏱</span> {d.label}
            </button>
          );
        }
        if (state.status === "finished") {
          return (
            <span key={key} className="chip chip--done" role="status">
              {m.ready}
              <button className="chip__stop" onClick={() => timers.stop(key)}>{m.silence}</button>
            </span>
          );
        }
        return (
          <span key={key} className="chip chip--running" role="timer">
            <span className="chip__time">{formatClock(state.remainingMs)}</span>
            <button className="chip__stop" onClick={() => timers.stop(key)} aria-label={m.cancelTimer(d.label)}>
              {m.cancel}
            </button>
          </span>
        );
      })}
    </div>
  );
}

import { alarmSounds, formatRemaining, remainingMs, type AlarmSound, type Timer } from "@timer/domain/timer";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

type Props = {
  timer: Timer;
  now: number;
  tilt: number;
  onStart(): void;
  onPause(): void;
  onReset(): void;
  onAddMinute(): void;
  onRemove(): void;
  onSound(sound: AlarmSound): void;
};

export function TimerCard({ timer, now, tilt, onStart, onPause, onReset, onAddMinute, onRemove, onSound }: Props) {
  const m = useMessages(messages);
  const left = remainingMs(timer, now);
  const done = timer.status === "finished";
  const progress = 1 - left / timer.durationMs;

  return (
    <article
      className={`card card--${timer.status}`}
      style={{ ["--tilt" as string]: `${tilt}deg` }}
      aria-label={m.timerOf(timer.label)}
    >
      <div className="card__magnet" aria-hidden="true" />
      <header className="card__head">
        <h2 className="card__title">{timer.label}</h2>
        <button className="icon-btn" onClick={onRemove} aria-label={m.remove(timer.label)}>
          ✕
        </button>
      </header>

      <p className="card__time" role="timer" aria-live={done ? "assertive" : "off"}>
        {formatRemaining(left)}
      </p>
      {done && <p className="card__stamp">{m.ready}</p>}

      <div className="bar" aria-hidden="true">
        <div className="bar__fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>

      <div className="card__actions">
        {timer.status === "running" ? (
          <button className="btn btn--butter" onClick={onPause}>{m.pause}</button>
        ) : (
          <button className="btn btn--tomato" onClick={onStart}>
            {done ? m.again : timer.status === "paused" ? m.resume : m.start}
          </button>
        )}
        <button className="btn btn--butter btn--plus" onClick={onAddMinute} aria-label={m.plusMinuteLabel(timer.label)}>
          {m.plusMinute}
        </button>
        <button className="btn btn--sage" onClick={onReset}>{done ? m.silence : m.reset}</button>
      </div>

      <label className="card__sound">
        <span>{m.ringsWith}</span>
        <select value={timer.sound} onChange={(e) => onSound(e.target.value as AlarmSound)}>
          {alarmSounds.map((s) => (
            <option key={s} value={s}>{m.sounds[s]}</option>
          ))}
        </select>
      </label>
    </article>
  );
}

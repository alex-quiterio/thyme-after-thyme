import { alarmSounds, formatRemaining, remainingMs, type AlarmSound, type Timer } from "@domain/timer";
import { soundLabels } from "./soundLabels";

type Props = {
  timer: Timer;
  now: number;
  tilt: number;
  onStart(): void;
  onPause(): void;
  onReset(): void;
  onRemove(): void;
  onSound(sound: AlarmSound): void;
};

export function TimerCard({ timer, now, tilt, onStart, onPause, onReset, onRemove, onSound }: Props) {
  const left = remainingMs(timer, now);
  const done = timer.status === "finished";
  const progress = 1 - left / timer.durationMs;

  return (
    <article
      className={`card card--${timer.status}`}
      style={{ ["--tilt" as string]: `${tilt}deg` }}
      aria-label={`${timer.label} timer`}
    >
      <div className="card__magnet" aria-hidden="true" />
      <header className="card__head">
        <h2 className="card__title">{timer.label}</h2>
        <button className="icon-btn" onClick={onRemove} aria-label={`Remove ${timer.label}`}>
          ✕
        </button>
      </header>

      <p className="card__time" role="timer" aria-live={done ? "assertive" : "off"}>
        {formatRemaining(left)}
      </p>
      {done && <p className="card__stamp">Dinner's ready!</p>}

      <div className="bar" aria-hidden="true">
        <div className="bar__fill" style={{ width: `${Math.min(100, progress * 100)}%` }} />
      </div>

      <div className="card__actions">
        {timer.status === "running" ? (
          <button className="btn btn--butter" onClick={onPause}>Pause</button>
        ) : (
          <button className="btn btn--tomato" onClick={onStart}>
            {done ? "Again" : timer.status === "paused" ? "Resume" : "Start"}
          </button>
        )}
        <button className="btn btn--sage" onClick={onReset}>{done ? "Silence" : "Reset"}</button>
      </div>

      <label className="card__sound">
        <span>Rings with</span>
        <select value={timer.sound} onChange={(e) => onSound(e.target.value as AlarmSound)}>
          {alarmSounds.map((s) => (
            <option key={s} value={s}>{soundLabels[s]}</option>
          ))}
        </select>
      </label>
    </article>
  );
}

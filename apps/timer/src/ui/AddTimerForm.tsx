import { useState } from "react";
import { alarmSounds, type AlarmSound } from "@domain/timer";
import { soundLabels } from "./soundLabels";

const presets = [
  { label: "Tea", minutes: 3 },
  { label: "Soft egg", minutes: 6 },
  { label: "Pasta", minutes: 10 },
  { label: "Rice", minutes: 15 },
  { label: "Roast", minutes: 45 },
  { label: "Bread proof", minutes: 60 },
];

type Props = { onAdd(label: string, durationMs: number, sound: AlarmSound, autostart: boolean): void };

export function AddTimerForm({ onAdd }: Props) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("5");
  const [sound, setSound] = useState<AlarmSound>("ring");
  const valid = Number(minutes) > 0;

  return (
    <section className="chalkboard" aria-labelledby="chalk-title">
      <h2 id="chalk-title" className="chalkboard__title">Today's specials</h2>

      <div className="chalkboard__presets">
        {presets.map((p) => (
          <button
            key={p.label}
            className="chalk-btn"
            onClick={() => onAdd(p.label, p.minutes * 60_000, sound, true)}
          >
            {p.label} <small>{p.minutes}′</small>
          </button>
        ))}
      </div>

      <form
        className="chalkboard__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onAdd(label, Number(minutes) * 60_000, sound, false);
          setLabel("");
        }}
      >
        <label>
          <span>Name</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Secret sauce" />
        </label>
        <label>
          <span>Minutes</span>
          <input
            type="number" min="0.1" step="any" inputMode="decimal"
            value={minutes} onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label>
          <span>Rings with</span>
          <select value={sound} onChange={(e) => setSound(e.target.value as AlarmSound)}>
            {alarmSounds.map((s) => (
              <option key={s} value={s}>{soundLabels[s]}</option>
            ))}
          </select>
        </label>
        <button className="btn btn--chalk" type="submit" disabled={!valid}>Set timer</button>
      </form>
    </section>
  );
}

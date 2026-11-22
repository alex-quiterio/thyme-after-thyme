import { useState } from "react";
import { alarmSounds, type AlarmSound } from "@timer/domain/timer";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

const presets = [
  { key: "tea", minutes: 3 },
  { key: "softEgg", minutes: 6 },
  { key: "pasta", minutes: 10 },
  { key: "rice", minutes: 15 },
  { key: "roast", minutes: 45 },
  { key: "bread", minutes: 60 },
] as const;

type Props = { onAdd(label: string, durationMs: number, sound: AlarmSound, autostart: boolean): void };

export function AddTimerForm({ onAdd }: Props) {
  const m = useMessages(messages);
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("5");
  const [sound, setSound] = useState<AlarmSound>("ring");
  const valid = Number(minutes) > 0;

  return (
    <section className="chalkboard" aria-labelledby="chalk-title">
      <h2 id="chalk-title" className="chalkboard__title">{m.specials}</h2>

      <div className="chalkboard__presets">
        {presets.map((p) => (
          <button
            key={p.key}
            className="chalk-btn"
            onClick={() => onAdd(m.presets[p.key], p.minutes * 60_000, sound, true)}
          >
            {m.presets[p.key]} <small>{p.minutes}′</small>
          </button>
        ))}
      </div>

      <form
        className="chalkboard__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onAdd(label.trim() || m.defaultLabel, Number(minutes) * 60_000, sound, false);
          setLabel("");
        }}
      >
        <label>
          <span>{m.name}</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={m.namePlaceholder} />
        </label>
        <label>
          <span>{m.minutes}</span>
          <input
            type="number" min="0.1" step="any" inputMode="decimal"
            value={minutes} onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label>
          <span>{m.ringsWith}</span>
          <select value={sound} onChange={(e) => setSound(e.target.value as AlarmSound)}>
            {alarmSounds.map((s) => (
              <option key={s} value={s}>{m.sounds[s]}</option>
            ))}
          </select>
        </label>
        <button className="btn btn--chalk" type="submit" disabled={!valid}>{m.setTimer}</button>
      </form>
    </section>
  );
}

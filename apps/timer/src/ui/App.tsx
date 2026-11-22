import type { TimerBoard } from "@application/timerBoard";
import { AddTimerForm } from "./AddTimerForm";
import { TimerCard } from "./TimerCard";
import { useBoard } from "./useBoard";

export function App({ board }: { board: TimerBoard }) {
  const { timers, now } = useBoard(board);

  return (
    <>
      <header className="plank">
        <h1 className="plank__title">Thyme After Thyme</h1>
        <p className="plank__tagline">a kitchen timer for people who keep burning the garlic</p>
      </header>

      <main className="counter">
        <AddTimerForm
          onAdd={(label, ms, sound, autostart) => {
            const id = board.add(label, ms, sound);
            if (autostart) board.start(id);
          }}
        />

        {timers.length === 0 ? (
          <p className="empty">Nothing on the stove. Pick a special or set your own.</p>
        ) : (
          <div className="shelf">
            {timers.map((t, i) => (
              <TimerCard
                key={t.id}
                timer={t}
                now={now}
                tilt={i % 2 === 0 ? -1.2 : 1.1}
                onStart={() => board.start(t.id)}
                onPause={() => board.pause(t.id)}
                onReset={() => board.reset(t.id)}
                onRemove={() => board.remove(t.id)}
                onSound={(s) => board.setSound(t.id, s)}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

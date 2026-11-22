import type { TimerBoard } from "@timer/application/timerBoard";
import { AddTimerForm } from "./AddTimerForm";
import { TimerCard } from "./TimerCard";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";
import { useBoard } from "./useBoard";

export function TimerTool({ board }: { board: TimerBoard }) {
  const { timers, now } = useBoard(board);
  const m = useMessages(messages);

  return (
    <>
      <AddTimerForm
        onAdd={(label, ms, sound, autostart) => {
          const id = board.add(label, ms, sound);
          if (autostart) board.start(id);
        }}
      />

      {timers.length === 0 ? (
        <p className="empty">{m.empty}</p>
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
    </>
  );
}

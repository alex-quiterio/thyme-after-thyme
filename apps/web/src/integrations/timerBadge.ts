// Glue: shows how many timers are running (or a "!" when one has finished) on the Timers tab,
// so you can see them from the recipe book without opening the Timers tab.
import { useSyncExternalStore } from "react";
import type { Locale } from "@shared/locales";
import type { ToolBadge } from "@shared/tool";
import { useLocale } from "@shared/useLocale";
import type { TimerBoard } from "@timer/application/timerBoard";

const labels: Record<Locale, { running: (n: number) => string; finished: (n: number) => string }> = {
  en: { running: (n) => `${n} running`, finished: (n) => `${n} finished` },
  pt: { running: (n) => `${n} a contar`, finished: (n) => `${n} terminado${n > 1 ? "s" : ""}` },
  it: { running: (n) => `${n} in corso`, finished: (n) => `${n} finito${n > 1 ? "i" : ""}` },
};

export function createTimerBadge(board: TimerBoard) {
  return function useTimerBadge(): ToolBadge | null {
    const { timers } = useSyncExternalStore(board.subscribe, board.getState);
    const locale = useLocale();
    const finished = timers.filter((t) => t.status === "finished").length;
    const running = timers.filter((t) => t.status === "running").length;
    if (finished > 0) return { text: "!", label: labels[locale].finished(finished), urgent: true };
    if (running > 0) return { text: String(running), label: labels[locale].running(running), urgent: false };
    return null;
  };
}

import { useSyncExternalStore } from "react";
import type { TimerBoard } from "@timer/application/timerBoard";

export function useBoard(board: TimerBoard) {
  // The clock itself is driven from the app root (see main.tsx), so timers keep running on every tab.
  return useSyncExternalStore(board.subscribe, board.getState);
}

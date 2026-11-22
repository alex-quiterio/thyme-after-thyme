import { useEffect, useSyncExternalStore } from "react";
import type { TimerBoard } from "@application/timerBoard";

export function useBoard(board: TimerBoard) {
  const state = useSyncExternalStore(board.subscribe, board.getState);
  useEffect(() => {
    const id = setInterval(board.tick, 250);
    return () => clearInterval(id);
  }, [board]);
  return state;
}

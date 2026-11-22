import { useState, useSyncExternalStore } from "react";
import { useMessages } from "@shared/useLocale";
import { appUpdate } from "./appUpdate";
import { messages } from "./messages";

export function UpdateToast() {
  const waiting = useSyncExternalStore(appUpdate.subscribe, appUpdate.snapshot);
  const [dismissed, setDismissed] = useState(false);
  const m = useMessages(messages).update;
  if (!waiting || dismissed) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <p className="toast__title">{m.title}</p>
      <p className="toast__text">{m.text}</p>
      <div className="toast__actions">
        <button className="btn btn--tomato" onClick={appUpdate.apply}>{m.now}</button>
        <button className="btn btn--sage" onClick={() => setDismissed(true)}>{m.later}</button>
      </div>
    </div>
  );
}

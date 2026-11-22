import { useState, useSyncExternalStore } from "react";
import { appUpdate } from "./appUpdate";

export function UpdateToast() {
  const waiting = useSyncExternalStore(appUpdate.subscribe, appUpdate.snapshot);
  const [dismissed, setDismissed] = useState(false);
  if (!waiting || dismissed) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <p className="toast__title">A fresher batch is ready</p>
      <p className="toast__text">A new version of Thyme After Thyme is available. Updating reloads the page, which resets any running timers.</p>
      <div className="toast__actions">
        <button className="btn btn--tomato" onClick={appUpdate.apply}>Update now</button>
        <button className="btn btn--sage" onClick={() => setDismissed(true)}>Later</button>
      </div>
    </div>
  );
}

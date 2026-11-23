import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

export function FestiveToggle({ emoji, enabled, onChange }: { emoji: string; enabled: boolean; onChange(value: boolean): void }) {
  const label = useMessages(messages).festive.toggle;
  return (
    <button className="festive-toggle" aria-pressed={enabled} aria-label={label} title={label} onClick={() => onChange(!enabled)}>
      <span aria-hidden="true">{emoji}</span>
    </button>
  );
}

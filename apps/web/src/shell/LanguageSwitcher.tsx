import { localeNames, locales } from "@shared/locales";
import { setLocale, useLocale, useMessages } from "@shared/useLocale";
import { messages } from "./messages";

export function LanguageSwitcher() {
  const locale = useLocale();
  const m = useMessages(messages);
  return (
    <div className="lang" role="group" aria-label={m.languageLabel}>
      {locales.map((l) => (
        <button
          key={l}
          className={`lang__btn${l === locale ? " lang__btn--active" : ""}`}
          aria-pressed={l === locale}
          aria-label={localeNames[l]}
          lang={l}
          onClick={() => setLocale(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

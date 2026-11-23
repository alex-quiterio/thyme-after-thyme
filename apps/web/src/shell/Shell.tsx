import { useEffect, useRef } from "react";
import { setToolTitle } from "@shared/pageTitle";
import type { ToolBadge, ToolDefinition } from "@shared/tool";
import { useSeason } from "@shared/useSeason";
import { useLocale, useMessages } from "@shared/useLocale";
import { FestiveBanner } from "./FestiveBanner";
import { FestiveToggle } from "./FestiveToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { messages } from "./messages";
import { UpdateToast } from "./UpdateToast";
import { useHashRoute } from "./useHashRoute";
import { useInstallPrompt } from "./useInstallPrompt";

const SEASON_EMOJI = { xmas: "🎄", nye: "🎆", halloween: "🎃", easter: "🐣", spring: "🌸", autumn: "🍂" } as const;
const FEEDBACK_URL = "https://github.com/alex-quiterio/thyme-after-thyme/issues/new";
const TEXT_FIELD = /^(text|search|number|email|url|tel|password)$/;

function TabBadge({ use }: { use: () => ToolBadge | null }) {
  const badge = use();
  if (!badge) return null;
  return (
    <span className={`nav__badge${badge.urgent ? " nav__badge--urgent" : ""}`} role="status" aria-label={badge.label}>
      {badge.text}
    </span>
  );
}

export function Shell({ tools }: { tools: ToolDefinition[] }) {
  const [route, go] = useHashRoute();
  const install = useInstallPrompt();
  const m = useMessages(messages);
  const locale = useLocale();
  const { occasion, enabled, setEnabled, toggleSeason, festiveDay } = useSeason();
  const main = useRef<HTMLElement>(null);
  const active = tools.find((t) => route === t.id || route.startsWith(`${t.id}/`)) ?? tools[0];

  useEffect(() => {
    if (active) setToolTitle(active.title[locale]);
  }, [active, locale]);

  // While typing, the on-screen keyboard shouldn't have a tab bar floating over the field.
  useEffect(() => {
    const isTextField = (target: EventTarget | null) =>
      target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && TEXT_FIELD.test(target.type));
    const on = (e: FocusEvent) => {
      if (isTextField(e.target)) document.documentElement.dataset.typing = "";
    };
    const off = () => void delete document.documentElement.dataset.typing;
    document.addEventListener("focusin", on);
    document.addEventListener("focusout", off);
    return () => {
      document.removeEventListener("focusin", on);
      document.removeEventListener("focusout", off);
    };
  }, []);

  return (
    <>
      <button className="skip-link" onClick={() => main.current?.focus()}>{m.skip}</button>

      <header className="plank">
        <div className="topbar">
          <div className="topbar__start">
            {festiveDay && (
              <FestiveToggle emoji={toggleSeason ? SEASON_EMOJI[toggleSeason] : "🎄"} enabled={enabled} onChange={setEnabled} />
            )}
            {install && (
              <button className="topbar__install" onClick={install}>
                <span aria-hidden="true">📲</span> {m.install}
              </button>
            )}
          </div>
          <LanguageSwitcher />
        </div>
        <h1 className="plank__title">Thyme After Thyme</h1>
        <p className="plank__tagline">{m.tagline}</p>
        {occasion && <FestiveBanner occasion={occasion} />}
        <nav className="nav" aria-label={m.navLabel}>
          {tools.map((t) => (
            <a
              key={t.id}
              href={`#/${t.id}`}
              className={`nav__tab${t === active ? " nav__tab--active" : ""}`}
              aria-current={t === active ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                go(t.id);
              }}
            >
              <span className="nav__icon" aria-hidden="true">{t.emoji}</span>
              <span className="nav__label">{t.title[locale]}</span>
              {t.useBadge && <TabBadge use={t.useBadge} />}
            </a>
          ))}
        </nav>
      </header>

      <main id="main-content" ref={main} tabIndex={-1} className="counter">
        {active?.render()}
      </main>

      <footer className="foot">
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer">{m.feedback}</a>
      </footer>

      <UpdateToast />
    </>
  );
}

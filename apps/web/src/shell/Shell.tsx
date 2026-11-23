import type { ToolDefinition } from "@shared/tool";
import { useLocale, useMessages } from "@shared/useLocale";
import { seasonFor } from "@shared/season";
import { useSeason } from "@shared/useSeason";
import { FestiveBanner } from "./FestiveBanner";
import { FestiveToggle } from "./FestiveToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { messages } from "./messages";
import { UpdateToast } from "./UpdateToast";
import { useHashRoute } from "./useHashRoute";
import { useInstallPrompt } from "./useInstallPrompt";

export function Shell({ tools }: { tools: ToolDefinition[] }) {
  const [route, go] = useHashRoute();
  const install = useInstallPrompt();
  const m = useMessages(messages);
  const locale = useLocale();
  const { season, now, enabled, setEnabled, festiveDay } = useSeason();
  const active = tools.find((t) => route === t.id || route.startsWith(`${t.id}/`)) ?? tools[0];

  return (
    <>
      <header className="plank">
        <div className="topbar">
          {festiveDay ? (
            <FestiveToggle emoji={(season ?? seasonFor(now)) === "nye" ? "🎆" : "🎄"} enabled={enabled} onChange={setEnabled} />
          ) : (
            <span />
          )}
          <LanguageSwitcher />
        </div>
        <h1 className="plank__title">Thyme After Thyme</h1>
        <p className="plank__tagline">{m.tagline}</p>
        {season && <FestiveBanner season={season} />}
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
              <span aria-hidden="true">{t.emoji}</span> {t.title[locale]}
            </a>
          ))}
          {install && (
            <button className="nav__tab nav__install" onClick={install}>
              <span aria-hidden="true">📲</span> {m.install}
            </button>
          )}
        </nav>
      </header>

      <main className="counter">{active?.render()}</main>

      <UpdateToast />
      {season && <div className={`festive-fx festive-fx--${season}`} aria-hidden="true" />}
    </>
  );
}

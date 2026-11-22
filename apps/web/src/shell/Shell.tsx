import type { ToolDefinition } from "@shared/tool";
import { useHashRoute } from "./useHashRoute";

export function Shell({ tools }: { tools: ToolDefinition[] }) {
  const [route, go] = useHashRoute();
  const active = tools.find((t) => t.id === route) ?? tools[0];

  return (
    <>
      <header className="plank">
        <h1 className="plank__title">Thyme After Thyme</h1>
        <p className="plank__tagline">kitchen tools for people who keep burning the garlic</p>
        <nav className="nav" aria-label="Kitchen tools">
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
              <span aria-hidden="true">{t.emoji}</span> {t.title}
            </a>
          ))}
        </nav>
      </header>

      <main className="counter">{active?.render()}</main>
    </>
  );
}

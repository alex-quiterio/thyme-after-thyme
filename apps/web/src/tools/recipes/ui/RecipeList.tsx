import { useState } from "react";
import type { RecipeShelf } from "@recipes/application/recipeBook";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

export function RecipeList({ shelf }: { shelf: RecipeShelf }) {
  const m = useMessages(messages);
  const [query, setQuery] = useState("");
  const results = shelf.search(query);

  return (
    <>
      <section className="cover" aria-label={m.coverLabel}>
        <div className="cover__label">
          <h2 className="cover__title">{shelf.title}</h2>
          {shelf.tagline && <p className="cover__tagline">{shelf.tagline}</p>}
        </div>
      </section>

      <div className="finder">
        <label className="visually-hidden" htmlFor="recipe-search">{m.searchLabel}</label>
        <input
          id="recipe-search"
          type="search"
          placeholder={m.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length === 0 ? (
        <p className="empty">{m.noMatch(query)}</p>
      ) : (
        <ul className="index">
          {results.map((r, i) => (
            <li key={r.id}>
              <a className="index-card" href={`#/recipes/${r.id}`} style={{ ["--tilt" as string]: `${i % 2 === 0 ? -0.8 : 0.8}deg` }}>
                <span className="index-card__no">{r.number !== null ? String(r.number).padStart(2, "0") : "★"}</span>
                <span className="index-card__title">{r.title}</span>
                {r.subtitle && <span className="index-card__sub">{r.subtitle}</span>}
                <span className="index-card__meta">
                  {r.kind === "note" ? m.notes : m.recipe}
                  {r.timerCount > 0 && <> · <span aria-hidden="true">⏱</span> {m.timers(r.timerCount)}</>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

import { useState } from "react";
import type { RecipeBook } from "@recipes/application/recipeBook";

export function RecipeList({ book }: { book: RecipeBook }) {
  const [query, setQuery] = useState("");
  const results = book.search(query);

  return (
    <>
      <section className="cover" aria-label="Cookbook">
        <div className="cover__label">
          <h2 className="cover__title">{book.title}</h2>
          {book.tagline && <p className="cover__tagline">{book.tagline}</p>}
        </div>
      </section>

      <div className="finder">
        <label className="visually-hidden" htmlFor="recipe-search">Search recipes</label>
        <input
          id="recipe-search"
          type="search"
          placeholder="Search by name or ingredient…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {results.length === 0 ? (
        <p className="empty">No recipe matches “{query}”. Try an ingredient, like <em>courgette</em>.</p>
      ) : (
        <ul className="index">
          {results.map((r, i) => (
            <li key={r.id}>
              <a className="index-card" href={`#/recipes/${r.id}`} style={{ ["--tilt" as string]: `${i % 2 === 0 ? -0.8 : 0.8}deg` }}>
                <span className="index-card__no">{r.number !== null ? String(r.number).padStart(2, "0") : "★"}</span>
                <span className="index-card__title">{r.title}</span>
                {r.subtitle && <span className="index-card__sub">{r.subtitle}</span>}
                <span className="index-card__meta">
                  {r.kind === "note" ? "notes" : "recipe"}
                  {r.timerCount > 0 && <> · <span aria-hidden="true">⏱</span> {r.timerCount} timer{r.timerCount > 1 ? "s" : ""}</>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

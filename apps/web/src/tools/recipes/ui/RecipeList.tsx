import { useRef, useState } from "react";
import type { RecipeBook, RecipeShelf } from "@recipes/application/recipeBook";
import { useLocale, useMessages } from "@shared/useLocale";
import { messages } from "./messages";

const MAX_BYTES = 2_000_000;

type Notice = { added: number; unchanged: number; errors: string[] };

export function RecipeList({ book, shelf }: { book: RecipeBook; shelf: RecipeShelf }) {
  const m = useMessages(messages);
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const results = shelf.search(query);

  async function importFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const total: Notice = { added: 0, unchanged: 0, errors: [] };
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        total.errors.push(`${file.name}: ${m.tooBig}`);
        continue;
      }
      const out = book.importFile(file.name, await file.text(), locale);
      total.added += out.added;
      total.unchanged += out.unchanged;
      total.errors.push(...out.errors);
    }
    setNotice(total);
    if (picker.current) picker.current.value = ""; // lets the same file be picked again
  }

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

      <div className="library-tools">
        <input
          ref={picker}
          className="visually-hidden"
          id="recipe-import"
          type="file"
          accept=".json,.md,.markdown,application/json,text/markdown"
          multiple
          onChange={(e) => void importFiles(e.target.files)}
        />
        <label className="btn btn--sage" htmlFor="recipe-import" title={m.importHint}>
          {m.importButton}
        </label>
        {book.hasRemovedDefaults() && (
          <button className="btn btn--butter" onClick={() => book.restoreDefaults()}>{m.restore}</button>
        )}
        <p className="library-tools__hint">{m.importHint}</p>
      </div>

      {notice && (
        <div className={`notice${notice.errors.length ? " notice--problem" : ""}`} role="status">
          <p className="notice__summary">{m.importResult(notice.added, notice.unchanged)}</p>
          {notice.errors.length > 0 && (
            <>
              <p className="notice__title">{m.importProblems}</p>
              <ul>{notice.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </>
          )}
          <button className="notice__close" onClick={() => setNotice(null)} aria-label={m.dismiss}>✕</button>
        </div>
      )}

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
                  {shelf.origin(r.id) === "imported" && <> · {m.yours}</>}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

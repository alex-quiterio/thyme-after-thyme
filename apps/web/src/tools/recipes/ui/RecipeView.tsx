import { useState, useSyncExternalStore } from "react";
import type { RecipeBook, RecipeShelf } from "@recipes/application/recipeBook";
import type { Recipe } from "@recipes/domain/recipe";
import { useMessages } from "@shared/useLocale";
import { Inline } from "./Inline";
import { messages } from "./messages";
import { StepTimerChips } from "./StepTimerChips";

export function RecipeView({ book, shelf, recipe }: { book: RecipeBook; shelf: RecipeShelf; recipe: Recipe }) {
  const m = useMessages(messages);
  const states = useSyncExternalStore(book.timers.subscribe, book.timers.snapshot);
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set());
  const { previous, next } = shelf.neighbours(recipe.id);

  const toggle = (key: string) =>
    setTicked((prev) => {
      const copy = new Set(prev);
      if (!copy.delete(key)) copy.add(key);
      return copy;
    });

  return (
    <>
      <a className="back" href="#/recipes">{m.back}</a>

      <article className="sheet page">
        <header>
          {recipe.number !== null && <p className="page__number">{m.number} {String(recipe.number).padStart(2, "0")}</p>}
          <h2 className="page__title">{recipe.title}</h2>
          {recipe.subtitle && <p className="page__subtitle">{recipe.subtitle}</p>}
          {recipe.timerCount > 0 && (
            <p className="page__hint">{m.hint}</p>
          )}
        </header>

        {recipe.sections.map((section, si) => (
          <section key={si} className={`part${section.method ? " part--method" : ""}`}>
            {section.title && <h3 className="part__title">{section.title}</h3>}

            {section.blocks.map((block, bi) => {
              const id = `${si}-${bi}`;
              if (block.kind === "bullets") {
                return (
                  <ul key={id} className="ingredients">
                    {block.items.map((item, ii) => {
                      const key = `${id}-${ii}`;
                      return (
                        <li key={key}>
                          <label className={ticked.has(key) ? "is-ticked" : undefined}>
                            <input type="checkbox" checked={ticked.has(key)} onChange={() => toggle(key)} />
                            <span><Inline text={item} /></span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              const timerPrefix = `${recipe.id}:${id}`;
              if (block.kind === "step") {
                const done = ticked.has(id);
                return (
                  <div key={id} className={`step${done ? " step--done" : ""}`}>
                    <button
                      className="step__num"
                      onClick={() => toggle(id)}
                      aria-pressed={done}
                      aria-label={m.step(block.number, done)}
                    >
                      {done ? "✓" : block.number}
                    </button>
                    <div className="step__body">
                      <p><Inline text={block.text} /></p>
                      <StepTimerChips
                        timers={book.timers} states={states} keyPrefix={timerPrefix}
                        durations={block.durations} label={recipe.title}
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={id} className="para">
                  <p><Inline text={block.text} /></p>
                  <StepTimerChips
                    timers={book.timers} states={states} keyPrefix={timerPrefix}
                    durations={block.durations} label={`${recipe.title}: ${section.title ?? ""}`.replace(/: $/, "")}
                  />
                </div>
              );
            })}
          </section>
        ))}
      </article>

      <nav className="pager" aria-label={m.moreRecipes}>
        {previous ? <a href={`#/recipes/${previous.id}`}>← {previous.title}</a> : <span />}
        {next ? <a href={`#/recipes/${next.id}`}>{next.title} →</a> : <span />}
      </nav>
    </>
  );
}

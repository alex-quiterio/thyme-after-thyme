import { useSyncExternalStore } from "react";
import { useStoredState } from "@shared/useStoredState";
import { useWakeLock } from "@shared/useWakeLock";
import type { RecipeBook, RecipeShelf } from "@recipes/application/recipeBook";
import type { Recipe } from "@recipes/domain/recipe";
import { useMessages } from "@shared/useLocale";
import { Inline } from "./Inline";
import { messages } from "./messages";
import { StepTimerChips } from "./StepTimerChips";

export function RecipeView({ book, shelf, recipe }: { book: RecipeBook; shelf: RecipeShelf; recipe: Recipe }) {
  const m = useMessages(messages);
  const states = useSyncExternalStore(book.timers.subscribe, book.timers.snapshot);
  const ticked = book.ticked(recipe.id); // remembered, so a sleeping phone or a reload keeps your place
  const { previous, next } = shelf.neighbours(recipe.id);

  // hands covered in flour: keep the screen on, and let the text be as big as needed
  const [awake, setAwake] = useStoredState<boolean>("thyme-after-thyme.keep-awake", true);
  const [size, setSize] = useStoredState<"m" | "l" | "xl">("thyme-after-thyme.text-size", "m");
  useWakeLock(awake);
  const sizes = ["m", "l", "xl"] as const;

  const toggle = (key: string) => book.toggleTick(recipe.id, key);

  const ingredientsAt = recipe.sections.findIndex((s) => s.blocks.some((b) => b.kind === "bullets"));
  const methodAt = recipe.sections.findIndex((s) => s.method);
  const jump = (index: number) =>
    document.getElementById(`section-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <a className="back" href="#/recipes">{m.back}</a>

      <article className="sheet page" data-size={size}>
        <header>
          {recipe.number !== null && <p className="page__number">{m.number} {String(recipe.number).padStart(2, "0")}</p>}
          <h2 className="page__title">{recipe.title}</h2>
          {recipe.subtitle && <p className="page__subtitle">{recipe.subtitle}</p>}
          {recipe.timerCount > 0 && (
            <p className="page__hint">{m.hint}</p>
          )}
          <div className="page__tools">
            <button className="chip" aria-pressed={awake} onClick={() => setAwake(!awake)}>
              <span aria-hidden="true">☀</span> {m.keepAwake}
            </button>
            <div className="sizer" role="group" aria-label={m.textSize}>
              {sizes.map((s, i) => (
                <button key={s} aria-pressed={size === s} aria-label={m.sizeNames[i]} onClick={() => setSize(s)}>
                  {m.sizes[i]}
                </button>
              ))}
            </div>
          </div>
          {(ingredientsAt >= 0 && methodAt >= 0) || ticked.size > 0 ? (
            <div className="jump">
              {ingredientsAt >= 0 && methodAt >= 0 && (
                <>
                  <button className="chip" onClick={() => jump(ingredientsAt)}>{m.jumpIngredients}</button>
                  <button className="chip" onClick={() => jump(methodAt)}>{m.jumpMethod}</button>
                </>
              )}
              {ticked.size > 0 && (
                <button className="link-btn" onClick={() => book.clearTicks(recipe.id)}>{m.clearProgress}</button>
              )}
            </div>
          ) : null}
        </header>

        {recipe.sections.map((section, si) => (
          <section key={si} id={`section-${si}`} className={`part${section.method ? " part--method" : ""}`}>
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
                      <p className="step__text" onClick={() => toggle(id)}><Inline text={block.text} /></p>
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

      <button
        className="remove-recipe"
        onClick={() => {
          if (!window.confirm(m.confirmRemove(recipe.title))) return;
          book.remove(recipe.id);
          window.location.hash = "#/recipes";
        }}
      >
        {m.removeThis}
      </button>

      <nav className="pager" aria-label={m.moreRecipes}>
        {previous ? <a href={`#/recipes/${previous.id}`}>← {previous.title}</a> : <span />}
        {next ? <a href={`#/recipes/${next.id}`}>{next.title} →</a> : <span />}
      </nav>
    </>
  );
}

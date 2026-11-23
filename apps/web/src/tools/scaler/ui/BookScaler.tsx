import { useState } from "react";
import type { PickedRecipe, ScalerStore } from "@scaler/application/scalerStore";
import { combine, factorForAnchor, measuredLines, scaleRecipe, type CatalogRecipe, type ScaledLine } from "@scaler/domain/recipeScaling";
import { formatAmount, parseAmount } from "@scaler/domain/scaling";
import { localizeDecimal } from "@shared/locales";
import { fold } from "@shared/text";
import { useLocale, useMessages } from "@shared/useLocale";
import { amountText } from "./amounts";
import { messages } from "./messages";

const CHIPS = [
  { text: "1/2", label: "½" },
  { text: "1", label: "1" },
  { text: "2", label: "2" },
  { text: "3", label: "3" },
  { text: "4", label: "4" },
];

function Lines({ lines }: { lines: ScaledLine[] }) {
  const m = useMessages(messages);
  const locale = useLocale();
  return (
    <ul className="sheet__list">
      {lines.map((l, i) => (
        <li key={`${l.name}-${l.unit}-${i}`}>
          <span>{l.name}</span>
          <span className="sheet__dots" aria-hidden="true" />
          <strong>{amountText(l, locale, m.units)}</strong>
        </li>
      ))}
    </ul>
  );
}

function Picker({ store, picked }: { store: ScalerStore; picked: PickedRecipe[] }) {
  const m = useMessages(messages);
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(picked.length === 0);
  const chosen = new Set(picked.map((p) => p.id));
  const shown = store.catalog.list(locale).filter((e) => fold(e.title).includes(fold(query.trim())));

  return (
    <details className="picker" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{m.pickButton(picked.length)}</summary>
      <div className="picker__body">
        <input type="search" placeholder={m.searchRecipes} aria-label={m.searchRecipes} value={query} onChange={(e) => setQuery(e.target.value)} />
        {shown.length === 0 ? (
          <p className="picker__empty">{m.noRecipesFound}</p>
        ) : (
          <ul className="picker__list">
            {shown.map((e) => (
              <li key={e.id}>
                <label className="picker__row">
                  <input
                    type="checkbox"
                    checked={chosen.has(e.id)}
                    onChange={() => (chosen.has(e.id) ? store.unpickRecipe(e.id) : store.pickRecipe(e.id))}
                  />
                  <span className="picker__title">{e.title}</span>
                  <small>{m.linesScalable(e.measured)}</small>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

function PickedCard({ store, picked, recipe }: { store: ScalerStore; picked: PickedRecipe; recipe: CatalogRecipe | null }) {
  const m = useMessages(messages);
  const locale = useLocale();
  const [anchor, setAnchor] = useState(0);
  const [have, setHave] = useState("");

  if (!recipe) {
    return (
      <section className="sheet recipe-scale">
        <p className="recipe-scale__missing">{m.missingRecipe}</p>
        <button className="btn btn--sage" onClick={() => store.unpickRecipe(picked.id)}>{m.remove(picked.id)}</button>
      </section>
    );
  }

  const scaled = scaleRecipe(recipe, picked.factor);
  const measured = measuredLines(recipe);
  const n = (x: number) => localizeDecimal(formatAmount(x), locale);
  const activeChip = scaled.factorValid ? CHIPS.find((c) => parseAmount(c.text) === scaled.factor)?.text : undefined;

  return (
    <section className="sheet recipe-scale" aria-label={recipe.title}>
      <header className="recipe-scale__head">
        <h3 className="recipe-scale__title">{recipe.title}</h3>
        <span className="recipe-scale__factor">×{n(scaled.factor)}</span>
        <button className="icon-btn" aria-label={m.remove(recipe.title)} onClick={() => store.unpickRecipe(picked.id)}>✕</button>
      </header>

      <div className="recipe-scale__controls">
        <div className="factor-chips" role="group" aria-label={m.multiplier}>
          <span className="factor-chips__label">{m.multiplier} ×</span>
          {CHIPS.map((c) => (
            <button key={c.text} aria-pressed={activeChip === c.text} onClick={() => store.setFactor(picked.id, c.text)}>{c.label}</button>
          ))}
          <input
            className="factor-chips__custom"
            inputMode="decimal"
            placeholder={m.customMultiplier}
            aria-label={m.customMultiplier}
            value={CHIPS.some((c) => c.text === picked.factor) || picked.factor === "" ? "" : picked.factor}
            onChange={(e) => store.setFactor(picked.id, e.target.value)}
          />
        </div>

        <div className="recipe-scale__have">
          <span>{m.haveLabel}</span>
          <input
            inputMode="decimal"
            aria-label={m.haveLabel}
            placeholder="300"
            value={have}
            onChange={(e) => {
              setHave(e.target.value);
              const f = factorForAnchor(recipe, anchor, e.target.value);
              if (f !== null) store.setFactor(picked.id, String(Number(f.toFixed(3))));
            }}
          />
          <span>{m.haveOf}</span>
          <select
            aria-label={m.haveOf}
            value={anchor}
            onChange={(e) => {
              const i = Number(e.target.value);
              setAnchor(i);
              const f = factorForAnchor(recipe, i, have);
              if (f !== null) store.setFactor(picked.id, String(Number(f.toFixed(3))));
            }}
          >
            {measured.map((l, i) => (
              <option key={i} value={i}>{l.name} ({amountText({ name: l.name, unit: l.unit, min: l.min, max: l.max }, locale, m.units)})</option>
            ))}
          </select>
        </div>
      </div>

      {!scaled.factorValid && <p className="recipe-scale__warn" role="alert">{m.badMultiplier}</p>}
      <Lines lines={scaled.lines} />
      {scaled.loose.length > 0 && (
        <p className="recipe-scale__loose"><strong>{m.asNeeded}:</strong> {scaled.loose.join(", ")}</p>
      )}
    </section>
  );
}

export function BookScaler({ store, picked }: { store: ScalerStore; picked: PickedRecipe[] }) {
  const m = useMessages(messages);
  const locale = useLocale();
  const found = picked.map((p) => ({ p, recipe: store.catalog.get(p.id, locale) }));
  const scaled = found.flatMap(({ p, recipe }) => (recipe ? [scaleRecipe(recipe, p.factor)] : []));
  const together = scaled.length >= 2 ? combine(scaled) : [];

  return (
    <section className="book-scaler" aria-labelledby="book-title">
      <h2 id="book-title" className="section-title">{m.bookTitle}</h2>
      <p className="book-scaler__hint">{m.bookHint}</p>
      <Picker store={store} picked={picked} />

      {picked.length === 0 ? (
        <p className="empty">{m.noPicked}</p>
      ) : (
        <>
          {found.map(({ p, recipe }) => (
            <PickedCard key={p.id} store={store} picked={p} recipe={recipe} />
          ))}
          {together.length > 0 && (
            <section className="sheet sheet--result recipe-scale" aria-label={m.allTogether}>
              <h3 className="recipe-scale__title">{m.allTogether}</h3>
              <p className="book-scaler__hint">{m.allTogetherHint}</p>
              <Lines lines={together} />
            </section>
          )}
          <button className="link-btn" onClick={store.clearPicked}>{m.clearAll}</button>
        </>
      )}
    </section>
  );
}

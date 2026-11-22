import { useSyncExternalStore } from "react";
import { formatAmount, scale, units, type Unit } from "@scaler/domain/scaling";
import type { ScalerStore } from "@scaler/application/scalerStore";
import { localizeDecimal } from "@shared/locales";
import { useLocale, useMessages } from "@shared/useLocale";
import { messages } from "./messages";

export function ScalerTool({ store }: { store: ScalerStore }) {
  const { ingredients, anchorId, target } = useSyncExternalStore(store.subscribe, store.getState);
  const m = useMessages(messages);
  const locale = useLocale();
  const scaling = scale(ingredients, anchorId, target);
  const anchor = ingredients.find((i) => i.id === anchorId);
  const number = (n: number) => localizeDecimal(formatAmount(n), locale);

  return (
    <>
      <section className="sheet" aria-labelledby="orig-title">
        <h2 id="orig-title" className="sheet__title">{m.recipeTitle}</h2>
        {ingredients.map((ing) => (
          <div key={ing.id} className="sheet__row">
            <input
              className="sheet__name"
              aria-label={m.nameLabel}
              placeholder={m.namePlaceholder}
              value={ing.name}
              onChange={(e) => store.updateIngredient(ing.id, { name: e.target.value })}
            />
            <input
              className="sheet__amount"
              aria-label={m.amountOf(ing.name || m.ingredient)}
              placeholder={m.amountPlaceholder}
              inputMode="decimal"
              value={ing.amount}
              onChange={(e) => store.updateIngredient(ing.id, { amount: e.target.value })}
            />
            <select
              className="sheet__unit"
              aria-label={m.unitLabel}
              value={ing.unit}
              onChange={(e) => store.updateIngredient(ing.id, { unit: e.target.value as Unit })}
            >
              {units.map((u) => (
                <option key={u} value={u}>{m.units[u]}</option>
              ))}
            </select>
            <button className="icon-btn" aria-label={m.remove(ing.name || m.ingredient)} onClick={() => store.removeIngredient(ing.id)}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn--sage sheet__add" onClick={store.addIngredient}>
          {m.add}
        </button>
      </section>

      <section className="chalkboard" aria-labelledby="have-title">
        <h2 id="have-title" className="chalkboard__title">{m.pantryTitle}</h2>
        <div className="chalkboard__form chalkboard__form--pair">
          <label>
            <span>{m.haveThisMuch}</span>
            <select value={anchorId ?? ""} onChange={(e) => store.setAnchor(e.target.value || null)}>
              <option value="">{m.pick}</option>
              {ingredients.map((ing, i) => (
                <option key={ing.id} value={ing.id}>{ing.name || m.ingredientN(i + 1)}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{m.amount}{anchor ? ` (${m.units[anchor.unit]})` : ""}</span>
            <input inputMode="decimal" placeholder={m.amountExample} value={target} onChange={(e) => store.setTarget(e.target.value)} />
          </label>
        </div>
      </section>

      {scaling ? (
        <section className="sheet sheet--result" aria-labelledby="res-title" aria-live="polite">
          <h2 id="res-title" className="sheet__title">{m.scaledTitle}</h2>
          <p className="sheet__factor">×{number(scaling.factor)}</p>
          <ul className="sheet__list">
            {scaling.items.map((item) => (
              <li key={item.id}>
                <span>{item.name || m.ingredient}</span>
                <span className="sheet__dots" aria-hidden="true" />
                <strong>
                  {item.scaled === null ? "—" : `${number(item.scaled)} ${m.units[item.unit]}`}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="empty">{m.hint}</p>
      )}
    </>
  );
}

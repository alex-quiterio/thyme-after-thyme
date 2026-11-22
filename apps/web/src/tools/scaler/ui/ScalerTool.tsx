import { useSyncExternalStore } from "react";
import { formatAmount, scale, units, type Unit } from "@scaler/domain/scaling";
import type { ScalerStore } from "@scaler/application/scalerStore";

export function ScalerTool({ store }: { store: ScalerStore }) {
  const { ingredients, anchorId, target } = useSyncExternalStore(store.subscribe, store.getState);
  const scaling = scale(ingredients, anchorId, target);
  const anchor = ingredients.find((i) => i.id === anchorId);

  return (
    <>
      <section className="sheet" aria-labelledby="orig-title">
        <h2 id="orig-title" className="sheet__title">The recipe as written</h2>
        {ingredients.map((ing) => (
          <div key={ing.id} className="sheet__row">
            <input
              className="sheet__name"
              aria-label="Ingredient name"
              placeholder="Ingredient"
              value={ing.name}
              onChange={(e) => store.updateIngredient(ing.id, { name: e.target.value })}
            />
            <input
              className="sheet__amount"
              aria-label={`Amount of ${ing.name || "ingredient"}`}
              placeholder="Amount"
              inputMode="decimal"
              value={ing.amount}
              onChange={(e) => store.updateIngredient(ing.id, { amount: e.target.value })}
            />
            <select
              className="sheet__unit"
              aria-label="Unit"
              value={ing.unit}
              onChange={(e) => store.updateIngredient(ing.id, { unit: e.target.value as Unit })}
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button className="icon-btn" aria-label={`Remove ${ing.name || "ingredient"}`} onClick={() => store.removeIngredient(ing.id)}>
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn--sage sheet__add" onClick={store.addIngredient}>
          + Add ingredient
        </button>
      </section>

      <section className="chalkboard" aria-labelledby="have-title">
        <h2 id="have-title" className="chalkboard__title">What's in the pantry?</h2>
        <div className="chalkboard__form chalkboard__form--pair">
          <label>
            <span>I have this much of</span>
            <select value={anchorId ?? ""} onChange={(e) => store.setAnchor(e.target.value || null)}>
              <option value="">Pick an ingredient</option>
              {ingredients.map((ing, i) => (
                <option key={ing.id} value={ing.id}>{ing.name || `Ingredient ${i + 1}`}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Amount{anchor ? ` (${anchor.unit})` : ""}</span>
            <input inputMode="decimal" placeholder="e.g. 300 or 1/2" value={target} onChange={(e) => store.setTarget(e.target.value)} />
          </label>
        </div>
      </section>

      {scaling ? (
        <section className="sheet sheet--result" aria-labelledby="res-title" aria-live="polite">
          <h2 id="res-title" className="sheet__title">Scaled recipe</h2>
          <p className="sheet__factor">×{formatAmount(scaling.factor)}</p>
          <ul className="sheet__list">
            {scaling.items.map((item) => (
              <li key={item.id}>
                <span>{item.name || "Ingredient"}</span>
                <span className="sheet__dots" aria-hidden="true" />
                <strong>
                  {item.scaled === null ? "—" : `${formatAmount(item.scaled)} ${item.unit}`}
                </strong>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="empty">Pick what you have and how much, and the whole recipe scales to match.</p>
      )}
    </>
  );
}

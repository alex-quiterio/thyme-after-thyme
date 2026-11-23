import { useEffect, useState } from "react";
import { occasionFor, previewOccasion, seasonOf, themeOverride, type Occasion, type Season } from "./season";

const KEY = "thyme-after-thyme.festive";

const readEnabled = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

/**
 * Which seasonal theme (if any) is showing, and sets `data-season` on <html> so CSS can react.
 * People can switch the festive look off; a `?theme=` link previews or forces one.
 */
export function useSeason() {
  const [now, setNow] = useState(() => new Date());
  const [enabled, setEnabledState] = useState(readEnabled);

  // keeps the theme right across midnight without a reload
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const override = themeOverride(window.location.search);
  const todayOccasion = occasionFor(now);
  // a preview link shows a typical day of that season; otherwise it's whatever today really is
  const occasion: Occasion | null =
    override === "none" ? null : override ? previewOccasion(override) : enabled ? todayOccasion : null;
  const season: Season | null = occasion ? seasonOf(occasion) : null;

  useEffect(() => {
    if (season) document.documentElement.dataset.season = season;
    else delete document.documentElement.dataset.season;
  }, [season]);

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    try {
      localStorage.setItem(KEY, value ? "on" : "off");
    } catch {
      // not remembered
    }
  };

  return {
    season,
    occasion,
    now,
    enabled,
    setEnabled,
    /** The season to show on the toggle even while it's switched off. */
    toggleSeason: season ?? (todayOccasion ? seasonOf(todayOccasion) : null),
    /** True when the toggle is worth showing: it's a festive day, or a preview link is in use. */
    festiveDay: todayOccasion !== null || override !== null,
  };
}

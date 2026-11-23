import { useEffect, useState } from "react";
import { seasonFor, themeOverride, type Season } from "./season";

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
  const today = seasonFor(now);
  const season: Season | null = override === "none" ? null : override ?? (enabled ? today : null);

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
    now,
    enabled,
    setEnabled,
    /** True when the toggle is worth showing: it's a festive day, or a preview link is in use. */
    festiveDay: today !== null || override !== null,
  };
}

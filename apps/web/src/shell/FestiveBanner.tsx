import { useEffect, useState } from "react";
import { formatClock } from "@shared/formatClock";
import { isNewYearsDay, msUntilMidnight, welcomedYear, type Season } from "@shared/season";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

/** A greeting under the title. On New Year's Eve it counts down to midnight. */
export function FestiveBanner({ season }: { season: Season }) {
  const m = useMessages(messages).festive;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (season !== "nye") return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [season]);

  if (season === "xmas") return <p className="festive-banner">🎄 {m.xmas} 🎄</p>;
  if (isNewYearsDay(now)) return <p className="festive-banner">🎆 {m.newYear(welcomedYear(now))} 🥂</p>;
  return (
    <p className="festive-banner">
      🥂 {m.nye} · {m.midnight} <span className="festive-banner__clock">{formatClock(msUntilMidnight(now))}</span>
    </p>
  );
}

import { useEffect, useState } from "react";
import { formatClock } from "@shared/formatClock";
import { msUntilMidnight, welcomedYear, type Occasion } from "@shared/season";
import { useMessages } from "@shared/useLocale";
import { messages } from "./messages";

/** A greeting under the title. On New Year's Eve it counts down to midnight. */
export function FestiveBanner({ occasion }: { occasion: Occasion }) {
  const m = useMessages(messages).festive;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (occasion !== "nye") return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [occasion]);

  if (occasion === "nye") {
    return (
      <p className="festive-banner">
        {m.nye} · {m.midnight} <span className="festive-banner__clock">{formatClock(msUntilMidnight(now))}</span>
      </p>
    );
  }
  const text: Record<Exclude<Occasion, "nye">, string> = {
    "xmas-eve": m.xmasEve,
    "xmas-day": m.xmasDay,
    "xmas-stephen": m.xmasStephen,
    "new-year": m.newYear(welcomedYear(now)),
    halloween: m.halloween,
    "all-saints": m.allSaints,
    "easter-weekend": m.easterWeekend,
    easter: m.easter,
    "easter-monday": m.easterMonday,
    "spring-equinox": m.springEquinox,
    "autumn-equinox": m.autumnEquinox,
  };
  return <p className="festive-banner">{text[occasion]}</p>;
}

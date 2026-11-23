/** The logo: a timer whose minute hand is a sprig of thyme. Colours follow the current theme. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 128 138" aria-hidden="true" focusable="false">
      <rect x="56" y="3" width="16" height="10" rx="3" style={{ fill: "var(--paper)" }}/>
      <rect x="60" y="11" width="8" height="9" rx="2" style={{ fill: "var(--paper)" }}/>
      <circle cx="64" cy="76" r="58" strokeWidth="6" style={{ fill: "var(--paper)", stroke: "var(--wood)" }}/>
      <line x1="64.0" y1="33.0" x2="64.0" y2="26.0" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <line x1="107.0" y1="76.0" x2="114.0" y2="76.0" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <line x1="64.0" y1="119.0" x2="64.0" y2="126.0" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <line x1="21.0" y1="76.0" x2="14.0" y2="76.0" strokeOpacity=".45" strokeWidth="3" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <line x1="64" y1="76" x2="87.8" y2="37.8" strokeWidth="3.6" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <ellipse cx="77.4" cy="65.6" rx="7.0" ry="4.5" transform="rotate(14 77.4 65.6)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="67.4" cy="59.4" rx="7.0" ry="4.5" transform="rotate(-130 67.4 59.4)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="83.3" cy="56.3" rx="7.0" ry="4.5" transform="rotate(14 83.3 56.3)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="73.3" cy="50.0" rx="7.0" ry="4.5" transform="rotate(-130 73.3 50.0)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="89.1" cy="47.0" rx="7.0" ry="4.5" transform="rotate(14 89.1 47.0)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="79.1" cy="40.7" rx="7.0" ry="4.5" transform="rotate(-130 79.1 40.7)" style={{ fill: "var(--plank-top)" }}/>
      <ellipse cx="90.2" cy="34.1" rx="6.0" ry="4.2" transform="rotate(-58 90.2 34.1)" style={{ fill: "var(--plank-top)" }}/>
      <line x1="64" y1="76" x2="45.6" y2="60.6" strokeWidth="5" strokeLinecap="round" style={{ stroke: "var(--wood)" }}/>
      <circle cx="64" cy="76" r="5.8" strokeWidth="2.5" style={{ fill: "var(--tomato)", stroke: "var(--paper)" }}/>
    </svg>
  );
}

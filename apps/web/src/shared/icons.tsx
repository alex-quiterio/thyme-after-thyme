/** Line icons: they draw in the current text colour, so they stay crisp on any theme (unlike emoji). */
type Props = { className?: string };

const svg = (children: React.ReactNode, className?: string) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const BookIcon = ({ className }: Props) =>
  svg(<><path d="M3.5 5.2c2.6-.9 5.2-.9 8.5.8v13c-3.3-1.7-5.9-1.7-8.5-.8z" /><path d="M20.5 5.2c-2.6-.9-5.2-.9-8.5.8v13c3.3-1.7 5.9-1.7 8.5-.8z" /></>, className);

export const TimerIcon = ({ className }: Props) =>
  svg(<><circle cx="12" cy="13.5" r="7.5" /><path d="M10 3h4M12 3v3M12 13.5V9.5M18.2 6.8l1.3-1.3" /></>, className);

export const ScaleIcon = ({ className }: Props) =>
  svg(<><path d="M12 5v14.5M8 20h8M4.5 7.5h15" /><path d="M5 7.5 2.6 13a2.6 2.6 0 0 0 4.8 0L5 7.5zM19 7.5 16.6 13a2.6 2.6 0 0 0 4.8 0L19 7.5z" /><circle cx="12" cy="4.2" r="0.9" /></>, className);

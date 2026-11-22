import type { ReactNode } from "react";

/** Renders **bold** and *italic* inside a line of recipe text. */
export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).forEach((chunk, i) => {
    if (chunk.startsWith("**")) parts.push(<strong key={i}>{chunk.slice(2, -2)}</strong>);
    else if (chunk.startsWith("*") && chunk.length > 2) parts.push(<em key={i}>{chunk.slice(1, -1)}</em>);
    else if (chunk) parts.push(chunk);
  });
  return <>{parts}</>;
}

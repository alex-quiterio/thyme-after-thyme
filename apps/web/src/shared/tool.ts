import type { ReactNode } from "react";
import type { Localized } from "./locales";

/** A small marker on a tool's tab, e.g. how many timers are running. */
export type ToolBadge = { text: string; label: string; urgent: boolean };

/** What the shell needs to know about a tool. Tools never import each other. */
export type ToolDefinition = {
  id: string;
  title: Localized<string>;
  emoji: string;
  render(): ReactNode;
  /** A hook returning the tab badge, or null for none. */
  useBadge?: () => ToolBadge | null;
};

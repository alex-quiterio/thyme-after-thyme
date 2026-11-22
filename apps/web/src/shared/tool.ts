import type { ReactNode } from "react";
import type { Localized } from "./locales";

/** What the shell needs to know about a tool. Tools never import each other. */
export type ToolDefinition = {
  id: string;
  title: Localized<string>;
  emoji: string;
  render(): ReactNode;
};

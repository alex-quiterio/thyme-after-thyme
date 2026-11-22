import type { ReactNode } from "react";

/** What the shell needs to know about a tool. Tools never import each other. */
export type ToolDefinition = {
  id: string;
  title: string;
  emoji: string;
  render(): ReactNode;
};

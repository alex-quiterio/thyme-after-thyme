const APP = "Thyme After Thyme";
let tool = "";
let detail: string | null = null;

const apply = () => {
  document.title = detail ? `${detail} · ${APP}` : tool ? `${tool} · ${APP}` : APP;
};

/** The current tool's name ("Timers"). */
export function setToolTitle(title: string): void {
  tool = title;
  apply();
}

/** What's open inside the tool (a recipe's name), or null. */
export function setDetailTitle(title: string | null): void {
  detail = title;
  apply();
}

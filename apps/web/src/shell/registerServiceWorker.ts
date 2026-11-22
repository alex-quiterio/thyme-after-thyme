/** Makes the app installable and usable offline. Fails silently (e.g. in the dev server). */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", document.baseURI).href).catch(() => {});
  });
}

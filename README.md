# Thyme After Thyme

Kitchen apps, with proper kitchen sounds.

**Live timer:** https://alex-quiterio.github.io/thyme-after-thyme/

| Part | What it is |
| --- | --- |
| `packages/sounds` | `@kitchen/sounds`: synthesized kitchen clock sounds (ding, chime, oven alarm, egg-timer ring, tick) on the Web Audio API |
| `apps/web` | The single web app: a shell with tabs, one tool per tab |
| `content/recipes/{pt,en,it}` | The recipe book (*A Pequena Mesa Verde* / *The Little Green Table* / *La Piccola Tavola Verde*), one markdown file per recipe per language |
| tool: recipes | Recipe book: search, tick off ingredients and steps, and start a timer for any time mentioned in a step |
| tool: timer | Multi-timer that rings with those sounds |
| tool: scaler | Recipe scaler (fractions OK, recipe saved in the browser) |
| *future tools* | guided cook mode, shopping list |

## Architecture

One web app, many tools. Each tool has its own DDD layers; the shell only knows a tool as `{ id, title, render }`.

```
apps/web/src/
  shell/           header, tab navigation, hash routing (#/timer, #/scaler)
  shared/          ToolDefinition contract
  styles/          shared kitchen theme (gingham, wood plank, chalkboard, buttons)
  tools/<tool>/
    domain/          pure rules (no libraries)
    application/     use cases + ports
    infrastructure/  adapters (Web Audio, localStorage, clock)
    ui/              React components
    styles/          tool-specific CSS
  main.tsx         composition root: the only place wiring adapters in
```

ESLint enforces the dependency direction per tool, forbids tools importing each other, and bans `../` imports across folders.

**Recipes → timers:** the recipe parser (`tools/recipes/domain`) finds durations in step text ("5–7 minutos", "2–3 horas") and the book starts them on the Timers board through a `StepTimers` port, implemented in `integrations/recipeTimers.ts`, so the tools never import each other.

**Languages:** English, Portuguese and Italian, switchable in the header (saved on the device, defaulting to the browser language). The interface text lives in `ui/messages.ts` next to each tool, typed `Localized<…>` so a missing translation fails the build. Recipes are translated by hand; the Portuguese set is the original.

**Add or edit a recipe:** add a markdown file to *each* of `content/recipes/pt`, `en` and `it`, named `NN — Title.md` with the same number (`## Ingredientes` bullets, `## Método` paragraphs). The number is the recipe's id, so the same recipe stays open when you change language. `bun run recipes:check` fails if the languages differ in structure (sections, bullets, steps, timers), since step timers are matched by position. `bun run recipes:bundle` runs automatically in dev, build and check.

**Recipes as JSON:** a recipe can also be a `.json` file in the same language folder (`26 — Tomato toast.json`): sections of `ingredients`, `steps` and `text`, in the order you write them, with optional explicit `timers` on a step. See `content/recipe.example.json` and `content/recipe.schema.json` (add `"$schema": "./recipe.schema.json"` for editor validation). Markdown and JSON can be mixed. Files are validated at build time with the exact place of any mistake. Set `RECIPES_DIR=/path/to/folder` (containing `pt/`, `en/`, `it/`) to read recipes from anywhere instead of `content/recipes`.

**Add a tool:** create `tools/<name>/{domain,application,infrastructure,ui}`, add an alias in `tsconfig.json`, add the name to `TOOLS` in `eslint.config.js`, and register it in `main.tsx`.

## Install as an app (PWA)

Chrome's old packaged "Chrome Apps" are discontinued; the modern equivalent is an installable web app. Open the site in Chrome and use the **Install app** button in the header (or the install icon in the address bar). It then runs in its own window, works offline, and has shortcuts for each tool. On Android/iOS use "Add to Home screen".

**Timers and alerts:** timers are saved on the device (running ones keep their absolute end time), so reloading, closing the app, or accepting an update doesn't lose them. A timer that ran out while the app was closed shows as finished and rings as soon as the app is opened. A finished timer alerts in layers: a looping sound, a system notification (only when the app isn't in front, permission asked when you start your first timer; tapping it brings the app forward), vibration, a flashing tab title and an app-icon badge. While a timer runs the screen is kept awake, and the clock runs in a worker so background tabs aren't throttled.

*Limits:* a web app can't wake itself once the phone freezes it (battery saver, app killed): in that case the alarm sounds the moment you open the app, not at the exact second. Notifications, vibration and the badge depend on the browser (on iPhone, notifications need the app added to the Home Screen; vibration isn't supported). Autoplay rules can keep the sound muted until the first tap after a reload.

**Updates:** a new version installs in the background and waits. The app shows a "A fresher batch is ready" message (checked every 30 minutes and whenever you return to the app); **Update now** activates it and reloads, **Later** dismisses it until the next load.

How it's built: `apps/web/public/manifest.webmanifest` + icons, and `public/sw.js` as a service worker template. `scripts/postbuild.ts` copies the icons and generates `dist/sw.js` with the list of built files to precache.

## Scripts

```
bun install
bun run web:dev       # bundles recipes, then dev server
bun run web:build     # production build (+ PWA files) to apps/web/dist
bun run check         # lint + typecheck + tests
```

Pushing to `main` runs `check` and deploys to GitHub Pages.

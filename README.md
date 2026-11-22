# Thyme After Thyme

Kitchen apps, with proper kitchen sounds.

**Live timer:** https://alex-quiterio.github.io/thyme-after-thyme/

| Part | What it is |
| --- | --- |
| `packages/sounds` | `@kitchen/sounds`: synthesized kitchen clock sounds (ding, chime, oven alarm, egg-timer ring, tick) on the Web Audio API |
| `apps/web` | The single web app: a shell with tabs, one tool per tab |
| tool: timer | Multi-timer that rings with those sounds |
| tool: scaler | Recipe scaler (fractions OK, recipe saved in the browser) |
| *future tools* | step-by-step recipe follower, recipe book |

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

**Add a tool:** create `tools/<name>/{domain,application,infrastructure,ui}`, add an alias in `tsconfig.json`, add the name to `TOOLS` in `eslint.config.js`, and register it in `main.tsx`.

## Install as an app (PWA)

Chrome's old packaged "Chrome Apps" are discontinued; the modern equivalent is an installable web app. Open the site in Chrome and use the **Install app** button in the header (or the install icon in the address bar). It then runs in its own window, works offline, and has shortcuts for each tool. On Android/iOS use "Add to Home screen".

How it's built: `apps/web/public/manifest.webmanifest` + icons, and `public/sw.js` as a service worker template. `scripts/postbuild.ts` copies the icons and generates `dist/sw.js` with the list of built files to precache.

## Scripts

```
bun install
bun run web:dev       # dev server
bun run web:build     # production build (+ PWA files) to apps/web/dist
bun run check         # lint + typecheck + tests
```

Pushing to `main` runs `check` and deploys to GitHub Pages.

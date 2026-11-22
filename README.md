# Thyme After Thyme

Kitchen apps, with proper kitchen sounds.

**Live timer:** https://alex-quiterio.github.io/thyme-after-thyme/

| Part | What it is |
| --- | --- |
| `packages/sounds` | `@kitchen/sounds`: synthesized kitchen clock sounds (ding, chime, oven alarm, egg-timer ring, tick) on the Web Audio API |
| `apps/timer` | Multi-timer web app that rings with those sounds |
| `apps/recipe-scaler` | Recipe scaler component (standalone, no build yet) |
| *future* | step-by-step recipe follower, recipe book |

## Timer architecture (DDD layers)

```
apps/timer/src/
  domain/          pure timer rules (no libraries)
  application/     use cases (timer board) + ports (Clock, Alarm)
  infrastructure/  adapters: system clock, Web Audio alarm (uses @kitchen/sounds)
  ui/              React components
  main.tsx         composition root, the only place wiring adapters in
```

ESLint (`no-restricted-imports`) enforces the dependency direction and bans `../` imports across folders.

## Scripts

```
bun install
bun run timer:dev     # dev server
bun run timer:build   # production build to apps/timer/dist
bun run check         # lint + typecheck + tests
```

Pushing to `main` runs `check` and deploys to GitHub Pages.

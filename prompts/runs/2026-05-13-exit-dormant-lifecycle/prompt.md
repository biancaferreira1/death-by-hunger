# Task: 2026-05-13-exit-dormant-lifecycle

## Goal (from queue)

Refactor the life cycle of existing `people` in `src/sketch.js` so there is no fade-to-disappear replacement spawn. **Existing** figures move **upward immediately** when triggered to leave. Once **y &lt; 0**, keep that slot **dormant** for **three seconds** (timer via **frame-based millis**, not `setTimeout` / `setInterval`), then reset the **same** object to the **bottom** of the window. Fixed pool, responsive layout compatible, continuous fly-up / respawn.

## Scope

- `src/sketch.js`
- `README.md` if behavior warrants it

## Acceptance

- [x] No crossfade “dying” before ascent; exit starts on `triggerDeath`
- [x] `y < 0` → dormant 3000 ms (`EXIT_DORMANT_MS`), then `resetFigureToCrowd`-style respawn
- [x] Same `figures` array / `CROWD_SIZE`; no splice for respawn
- [x] Dormant slots not drawn; timers use `clockMs`/millis, not `setTimeout`

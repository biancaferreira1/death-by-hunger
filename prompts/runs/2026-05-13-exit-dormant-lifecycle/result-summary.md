# Result: 2026-05-13-exit-dormant-lifecycle

## What changed

- **`src/sketch.js`** — Replaced **`dying`/`ascending`** with **`exiting`** (immediate ascent, dead+halo sprite) and **`dormant`** (invisible off-screen until **`clockMs >= dormantWakeAt`**). **`EXIT_DORMANT_MS: 3000`**. Removed crossfade / **`fillAmt`** / **`DYING_STEP`**. **`makeFigure`** includes **`dormantWakeAt`**. **`remapCrowd`** scales **`exiting`** / **`dormant`** like other off-crowd states. Draw order: alive, then exiting.
- **`README.md`** — Controls + **CONFIG** mention exit / dormant / no `setTimeout`.
- **`prompts/queue/prompt.md`** — Removed after run (misnamed source; formal task id **2026-05-13-exit-dormant-lifecycle**).

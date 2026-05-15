# Result: 2026-05-11-pre-death-pulse-lifecycle

## What changed

- **`src/sketch.js`** — Added **`preDeath`** state: **`triggerDeath`** sets **`preDeath`** and **`preDeathStartMs`**; **`preDeathPulseVis`** uses \( \cos^2(\pi u)\) over **`PRE_DEATH_MS`** (default 1400 ms). After the pulse, transition to **`exiting`** (unchanged ascent, dead+halo). **`EXIT_DORMANT_MS`** unchanged for post-**`y < 0`** wait; **`resetFigureToCrowd`** clears **`preDeathStartMs`**. **`remapCrowd`** keeps **`preDeath`** figures on-crowd (scale + constrain). Draw order: **`alive` + `preDeath`**, then **`exiting`**.
- **`README.md`** — Controls and **CONFIG** mention **`PRE_DEATH_MS`** and the pulse-before-exit behavior.
- **`prompts/queue/prompt.md`** — Archived as this run; queue file removed (generic name).

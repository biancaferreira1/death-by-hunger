# Result: change-to-people

## What changed

- **`src/sketch.js`** — Replaced the wheat visualization with 300 stick figures on a white background, black strokes, white fill while alive, subtle sine-based “breathing” scale for living figures only. Added **`triggerDeath()`** (exposed as `window.triggerDeath`): picks a random living figure, lerps inner fill white→black, then moves it upward until off-canvas and **removes** it from the array. No timers drive deaths. **`D`** calls `triggerDeath()` for testing. Marked **API integration** block at top of file per prompt.
- **`README.md`** — Described the new interaction, controls, config, and `window.triggerDeath()` hook (removed obsolete wheat/`setDeathsCount` docs).
- **`index.html`** — Page title set to **Death by Hunger**.
- **`style.css`** — Page background set to white so letterboxing matches the sketch.
- **`prompts/queue/change-to-people.md`** — Removed after run completion (queue retains `.gitkeep`).

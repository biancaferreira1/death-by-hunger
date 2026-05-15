# Death by Hunger

A `p5.js` “sea of people”: each person is a frame from **`assets/person-sprites-4.png`** (one row: two walk frames alive, two with halo while dead). `triggerDeath()` drives losses (no `setInterval`). The crowd is a **fixed pool** of **300** recycled figures (same count as the historical wheat “pixel” scale order-of-magnitude).

## Project Structure

- `index.html` - app entry point
- `src/sketch.js` - crowd animation, sprite slicing, and `triggerDeath()` logic
- `assets/person-sprites-4.png` - character spritesheet (near-black keyed to transparent at runtime)
- `style.css` - page styling
- `libs/p5.min.js` - local `p5.js` runtime

## Run Locally

This project is static and does not require a build tool.

1. Open a terminal in the project folder.
2. Start a local web server:

```bash
python3 -m http.server 8000
```

3. Open your browser at:

`http://localhost:8000`

4. Stop the server with `Ctrl + C`.

## Controls

- Press **`F`** to toggle **fullscreen** (browser fullscreen for the sketch canvas).
- Press **`D`** to trigger one death (for testing): a random eligible living figure dies, rises off the top, then **recycles** back into the pool.

## Death rate (demo)

The optional simulator (`USE_SIMULATED_DEATHS` in `sketch.js`) uses about **one death every 3.47 seconds** on average, from a classroom-sized chain: **~9.1 million deaths per year** → ~24,931/day → ~17.3/min → \(60 \div 17.3 \approx 3.47\) s. Turn off simulation when wiring real API events.

## Configuration

Tunable values live near the top of `src/sketch.js` in the `CONFIG` object (crowd size, padding, `SPRITE_DRAW_W`, fade speed, ascent speed, `SIM_DEATHS_PER_SEC`). Replace **`assets/person-sprites-4.png`** to change art (update `SPRITE_COLS` / `SPRITE_ROWS` if the grid changes).

## Backend hook

When integrating with real data, call:

`window.triggerDeath()`

once per API-reported acute starvation event (from your fetch/stream handler). Do **not** call it from `setInterval` or other timers.

## Prompt-driven collaboration

Contributors can run queued tasks and record outcomes under `prompts/`. See `prompts/README.md` and `docs/collaboration/RUNBOOK.md` for the standard flow.

# Death by Hunger

A `p5.js` “sea of people”: each person is a frame from **`assets/person-sprites.png`** (8×5 sheet: walk right/left/up/down, spawn/die). Alive figures loop the **walk down** row; **spawn/die** while fading; **walk up** while rising off screen. `triggerDeath()` drives losses (no timer).

## Project Structure

- `index.html` - app entry point
- `src/sketch.js` - crowd animation, sprite slicing, and `triggerDeath()` logic
- `assets/person-sprites.png` - character spritesheet (used as provided; near-black keyed to transparent at runtime for the white canvas)
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
- Press **`D`** to trigger one death (for testing): a random living figure fades to black, then rises off the canvas and is removed.

## Configuration

Tunable values live near the top of `src/sketch.js` in the `CONFIG` object (crowd size, padding, `SPRITE_DRAW_W`, fade speed, ascent speed). Replace **`assets/person-sprites.png`** to change art (keep **8 columns × 5 rows** layout or update `SPRITE_COLS` / `SPRITE_ROWS`).

## Backend hook

When integrating with real data, call:

`window.triggerDeath()`

once per API-reported acute starvation event (from your fetch/stream handler). Do **not** call it from `setInterval` or other timers.

## Prompt-driven collaboration

Contributors can run queued tasks and record outcomes under `prompts/`. See `prompts/README.md` and `docs/collaboration/RUNBOOK.md` for the standard flow.

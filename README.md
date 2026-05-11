# Death by Hunger

A `p5.js` “sea of people”: hundreds of person sprites (`assets/person.svg`, transparent background) on a white field, with a subtle idle motion. Each loss is represented interactively (not on a timer) via `triggerDeath()`.

## Project Structure

- `index.html` - app entry point
- `src/sketch.js` - crowd animation and `triggerDeath()` logic
- `assets/person.svg` - person graphic (transparent background; replace to customize)
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

- Press **`D`** to trigger one death (for testing): a random living figure fades to black, then rises off the canvas and is removed.

## Configuration

Tunable values live near the top of `src/sketch.js` in the `CONFIG` object (crowd size, padding, sprite width factor `PERSON_DRAW_W`, fade speed, ascent speed). Swap **`assets/person.svg`** for your own art (SVG or use a **PNG with alpha**—then point `loadImage` at that file); aspect ratio is read from the loaded image.

## Backend hook

When integrating with real data, call:

`window.triggerDeath()`

once per API-reported acute starvation event (from your fetch/stream handler). Do **not** call it from `setInterval` or other timers.

## Prompt-driven collaboration

Contributors can run queued tasks and record outcomes under `prompts/`. See `prompts/README.md` and `docs/collaboration/RUNBOOK.md` for the standard flow.

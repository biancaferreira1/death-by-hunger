# Result: 2026-04-30-responsive

## What changed

- **`src/sketch.js`** — Removed fixed `CONFIG.SIZE` (400). The sketch now tracks `canvasW` / `canvasH` from `p.windowWidth` / `p.windowHeight` via `syncCanvasToWindow(p)`, uses them in `createCanvas` / `resizeCanvas`, and scales layout (ground, sky band, stem placement, background) with those dimensions. `windowResized` resizes the canvas and calls `initScene(p, true)` to preserve progress.
- **`style.css`** — `#app` is full width and height so the canvas mount fills the viewport under `html, body { height: 100% }`.
- **`prompts/queue/2026-04-30-responsive.md`** — Removed after the run (queue empty except `.gitkeep`).

The wheat sprite layout still uses the same grid math; only the drawing surface and scene proportions follow the window.

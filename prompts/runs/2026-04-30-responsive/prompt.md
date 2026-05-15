# Task: 2026-04-30-responsive

## Goal

Make the p5 sketch fill the browser viewport: canvas size follows `windowWidth` / `windowHeight`, layout scales with the drawing surface, and resizing the window updates the scene without losing continuity.

## Scope (Allowed Files)

- `src/sketch.js`
- `style.css`

## Out of Scope

- Changing the visualization metaphor beyond what is required for layout (e.g. replacing wheat with other art) unless strictly necessary for scaling hooks
- CI, deployment, secrets, unrelated folders

## Acceptance Criteria

- [ ] Canvas mount fills the viewport (`#app` / page layout supports full-window canvas)
- [ ] `createCanvas` / `resizeCanvas` use synced width and height from the window
- [ ] `windowResized` adjusts canvas and scene geometry appropriately
- [ ] Manual check: resize the browser; sketch redraws correctly

## Required Verification Commands

```bash
git status --short
```

## Commit Message Guidance

`prompt(run): 2026-04-30-responsive - responsive canvas`

## Risks / Notes

- Preserve existing simulation/state behavior when reshaping; prefer remapping positions over hard resets unless the task explicitly allows re-init.

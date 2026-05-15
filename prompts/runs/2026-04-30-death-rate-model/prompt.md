# Task: 2026-04-30-death-rate-model

## Goal

Drive the visualization from the same back-of-the-envelope rate modeled here: 9,100,000 ÷ 365 (days) ≈ 24,931 deaths per day → ≈ 17.3 deaths per minute → **about one death every 3.47 seconds**. Each event should be reflected in the app at that average interval (for the current “people” sketch: via `triggerDeath` / simulated rate, not `setInterval`). Originally the wheat build also targeted **~25,000** units in the field; map that idea to the current crowd size or document the chosen equivalent.

## Scope (Allowed Files)

- `src/sketch.js`
- `README.md` (only if user-facing behavior or config knobs changes)

## Out of Scope

- Replacing the spritesheet or redesigning visuals
- `prompts/` layout (except this file is already in `prompts/queue/` by design)
- Infrastructure or deployment changes

## Acceptance Criteria

- [ ] Simulated or documented death rate matches **~1 death per 3.47 s** on average (`SIM_DEATHS_PER_SEC` ≈ `1 / 3.47` or equivalent time-based accumulator), unless the task author explicitly chooses API-only mode
- [ ] Comment or README briefly cites the 9.1M/year → 3.47 s derivation for students
- [ ] No `setInterval` for deaths (keep draw-loop or event-driven pattern consistent with project rules)

## Required Verification Commands

```bash
git status --short
```

Optional manual: run the sketch and confirm deaths do not arrive much faster than ~3.5 s apart on average over a long window.

## Commit Message Guidance

`prompt(run): 2026-04-30-death-rate-model - align simulated rate to ~3.47s`

## Risks / Notes

- This task was **recovered** after content was mistakenly edited under `prompts/runs/2026-04-30-responsive/prompt.md`. **Author new prompts only under `prompts/queue/`**; copy into `prompts/runs/<task-id>/prompt.md` when starting a run (see `prompts/README.md`).

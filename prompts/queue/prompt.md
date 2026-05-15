# Task: 2026-05-12-recycle-crowd-pool

## Goal

The crowd must stay a **fixed pool** (exactly **300** person slots) that never grows or shrinks. Remove any pattern that **splices**, **pops**, or **pushes** new figure objects after initial setup. When a soul finishes rising off the top, **recycle** that same object: set it back to **alive**, clear upward velocity, reset the death transition, and place it at a **random position in the bottom half** of the scene so the sea looks self-replenishing. `triggerDeath` should only choose among figures that are currently eligible (alive / fully “present” per existing rules).

## Scope (Allowed Files)

- `src/sketch.js`
- `README.md` (only if the interaction description should mention the fixed pool)

## Out of Scope

- New spritesheets or visual redesign
- Changing simulated API / `setInterval` policy (still no `setInterval` for deaths)

## Acceptance Criteria

- [ ] `figures.length === CONFIG.CROWD_SIZE` (300) at all times after `initCrowd`
- [ ] No `splice` / `pop` / post-init `push` on the figures array for respawn
- [ ] After leaving the top, a figure becomes alive again and respawns in the **bottom half** with velocity reset
- [ ] `triggerDeath` still only affects eligible living figures

## Required Verification Commands

```bash
git status --short
```

Manual: run sketch, trigger several deaths; crowd density should not thin out over time.

## Commit Message Guidance

`feat(sketch): recycle fixed crowd pool (300)`

## Risks / Notes

- Recovered from text wrongly added to **`prompts/runs/change-to-people/prompt.md`**.

# Result: 2026-05-12-recycle-crowd-pool

## What changed

- **`src/sketch.js`** — **`CONFIG.CROWD_SIZE`** set to **300**. Removed **`splice` / `makeFigure` push** after souls leave the top. Added **`resetFigureToCrowd(p, fig)`** to recycle the same slot: **`alive`**, **`fillAmt` / `ascendVel` reset**, **`bornAt`** refreshed for fade-in, new **`size`**, position in the **upper half of the lower spawn band** (bottom half of the valid crowd strip). **`updateFigures`** now iterates forward (no array mutations).
- **`prompts/runs/change-to-people/prompt.md`** — Restored archival **change-to-people** wording; note points follow-up to this task.
- **`prompts/runs/change-to-people/result-summary.md`** — Short note linking the recycle follow-up run.
- **`prompts/queue/2026-05-12-recycle-crowd-pool.md`** — Removed after run (standard queue hygiene).

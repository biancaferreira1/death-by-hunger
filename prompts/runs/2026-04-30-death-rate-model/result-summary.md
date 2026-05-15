# Result: 2026-04-30-death-rate-model

## What changed

- **`src/sketch.js`** — Set **`SIM_DEATHS_PER_SEC`** to **`17.3 / 60`** (~0.288/s, i.e. one death about every **3.47 s** on average). Added a **CONFIG** comment with the **9.1M/year → daily → hourly → ~17.3/min → 3.47 s** chain. Top API block text no longer refers to the old wheat rate.
- **`README.md`** — Describes **`person-sprites-4.png`**, corrects control copy for **D** / recycling, adds a short **Death rate (demo)** line with the same derivation; notes fixed pool **300** vs historical “~25k wheat pixels” comparison.
- **`prompts/README.md`** — Quick flow: queue files must be **`YYYY-MM-DD-short-slug.md`**, not generic **`prompt.md`**.

## Queue hygiene

- **`prompts/queue/prompt.md`** — Removed (duplicate / misnamed; same body as archived **change-to-people**; real tasks must use **`YYYY-MM-DD-short-slug.md`**).
- **`prompts/queue/2026-04-30-death-rate-model.md`** — Removed after this run.

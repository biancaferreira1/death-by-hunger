# Verification: 2026-04-30-example-task

## Required: `git status --short`

```bash
git status --short
```

**Outcome (exit 0):**

```
 M README.md
 D prompts/queue/2026-04-30-example-task.md
?? prompts/runs/2026-04-30-example-task/
```

Expected: modified README, removed completed queue item, new untracked run directory until committed.

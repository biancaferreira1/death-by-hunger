# Verification: 2026-04-30-responsive

## `git status --short`

```bash
git status --short
```

**Output (before commit):**

```
 D prompts/queue/2026-04-30-responsive.md
 M src/sketch.js
 M style.css
?? prompts/runs/2026-04-30-responsive/
```

## Manual

Open the site via local static server (`python3 -m http.server`), resize the browser window: canvas should fill the viewport and redraw correctly.

# Verification: change-to-people

## Required

Task file did not list verification commands. Ran from repo root:

```bash
git status --short
```

**Output (before commit):**

```
 M README.md
 M index.html
 D prompts/queue/change-to-people.md
 M src/sketch.js
 M style.css
?? prompts/runs/change-to-people/
```

## Manual

- Serve locally (`python3 -m http.server 8000`), open the app: white background, crowd of outlined figures with subtle motion, no on-canvas text.
- Press **D**: one random living figure fades inner fill to black, rises off top, disappears from the crowd.

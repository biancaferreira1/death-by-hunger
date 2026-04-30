# Prompt Operations

This folder manages prompt-driven work executed by collaborators.

## Layout

- `queue/` - pending prompt tasks
- `runs/` - execution records for completed/in-progress tasks
- `templates/` - reusable prompt and handoff templates

## Quick Flow

1. Pull latest changes from GitHub.
2. Pick one file from `queue/`.
3. Copy task details into `runs/<task-id>/prompt.md`.
4. Execute prompt work and implement code changes.
5. Fill run artifacts (`result-summary.md`, `verification.md`, `changed-files.txt`).
6. Commit and push.

## Task ID Convention

Use `YYYY-MM-DD-short-slug` consistently for:

- queue filenames
- run directories
- optional branch names (`prompt/<task-id>`)

---

## How to create a new prompt task (step by step)

These steps are for **authors** who add work to the queue. Someone else (or you later) will **run** the task using the runbook in `docs/collaboration/RUNBOOK.md`.

### 1. Start from the template

- Open `prompts/templates/prompt-template.md`.
- Copy everything in that file.

### 2. Pick a task ID and filename

- Use today’s date and a short description, all lowercase with hyphens: `YYYY-MM-DD-short-slug`.
- Examples: `2026-04-30-fix-hud-typo`, `2026-05-01-add-export-button`.
- Your new file must live in **`prompts/queue/`** and end in `.md`.
- Full path example: `prompts/queue/2026-05-01-add-export-button.md`.

### 3. Fill in every section

Replace the placeholders so a runner knows exactly what to do:

| Section | What to write |
|--------|----------------|
| **Goal** | What “done” looks like in plain language (1–3 sentences). |
| **Scope (Allowed Files)** | Only paths that may be edited. Be explicit (e.g. `src/sketch.js`, `README.md`). |
| **Out of Scope** | What must **not** change (CI, secrets, unrelated folders, etc.). |
| **Acceptance Criteria** | Checklist the runner can tick off. |
| **Required Verification Commands** | Exact shell commands to run before committing (copy-paste ready). |
| **Commit Message Guidance** | Suggested subject line for the **run** commit (see commit convention below). |
| **Risks / Notes** | Edge cases, data risks, or “do not break X” notes. |

Save the file under `prompts/queue/<your-task-id>.md`.

### 4. Quick self-check

- Is the task ID the same in the title **and** the filename?
- Is the scope narrow enough to review safely?
- Would someone who does not know the project still understand the goal?

---

## How to commit and push a new queue task

Do this from the **project root** (the folder that contains `prompts/`).

### 1. See what changed

```bash
git status
```

You should see your new file under `prompts/queue/` (or a modified file if you edited an existing task).

### 2. Stage only what you intend

```bash
git add prompts/queue/<your-new-file>.md
```

If you created several queue files, you can stage the whole folder:

```bash
git add prompts/queue/
```

### 3. Commit with a clear message

Use a short message that says you **added** or **updated** a queued task, for example:

```bash
git commit -m "prompt(queue): add 2026-05-01-add-export-button task"
```

Or for an edit to an existing task:

```bash
git commit -m "prompt(queue): clarify scope for 2026-05-01-add-export-button"
```

### 4. Push to GitHub

```bash
git push
```

If your branch is new or the remote uses another default name, Git may tell you to set upstream once, for example:

```bash
git push -u origin main
```

After this, collaborators can `git pull` and see the new task in `prompts/queue/`.

---

## How to `git pull` regularly

Pulling means: **download the latest commits from GitHub and merge them into your local copy**. That way you do not work on an old version of the project or duplicate tasks someone else already finished.

### When to pull

- **Before** you start work for the day (or before each work session).
- **Before** you create or run a prompt task, so your `prompts/queue/` matches the team.
- **Before** you push, if others might have pushed first (reduces merge conflicts).

### What to run

From the project root:

```bash
git pull
```

If your team uses a named branch (for example `main`):

```bash
git checkout main
git pull
```

### If Git reports conflicts

- Git will list conflicted files. Open them, resolve the `<<<<<<<` / `=======` / `>>>>>>>` markers, save, then:

```bash
git add <resolved-files>
git commit -m "Merge remote changes"
git push
```

For a class or small team, pulling at the start of each session is usually enough; there is no need to run `git pull` every few minutes unless you are coordinating tightly with others on the same files.

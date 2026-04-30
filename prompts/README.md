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

# Prompt Collaboration Runbook

Use this process when another contributor runs prompts for this repository.

## Standard Flow

1. `git pull` on the target branch.
2. Select one task from `prompts/queue/`.
3. Create a run directory: `prompts/runs/<task-id>/`.
4. Copy task details into `prompts/runs/<task-id>/prompt.md`.
5. Execute prompt and implement requested changes.
6. Record outputs:
   - `result-summary.md`
   - `changed-files.txt`
   - `verification.md`
7. Run required verification commands listed in the task.
8. Commit with approved message style.
9. `git push`.

## Do / Do Not

### Do
- Keep changes inside the declared scope.
- Explain all modified files in `result-summary.md`.
- Keep commits small and reviewable.

### Do Not
- Edit unrelated files.
- Skip verification steps.
- Force-push shared branches unless explicitly approved.

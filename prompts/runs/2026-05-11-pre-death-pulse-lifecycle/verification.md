# Verification: 2026-05-11-pre-death-pulse-lifecycle

```bash
git status --short
```

Manual: press **D** or wait for sim—figure should **pulse** (fade out/in on the same spot) using the alive sprite, then **rise** with dead+halo. After **\(y < 0\)**, **~3 s** invisible, then **respawn** near bottom. **`figures.length === 300`** always; resize during **preDeath** / exit / dormant should stay stable.

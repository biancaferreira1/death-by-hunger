# Death by Hunger

An interactive pixel-art wheat visualization built with `p5.js`.  
As the death count increases, wheat pixels fall from the stalk to represent loss over time.

## Project Structure

- `index.html` - app entry point
- `src/sketch.js` - main animation and logic
- `style.css` - page styling
- `libs/p5.min.js` - local `p5.js` runtime

## Run Locally

This project is static and does not require a build tool.

1. Open a terminal in the project folder.
2. Start a local web server:

```bash
python3 -m http.server 8000
```

3. Open your browser at:

`http://localhost:8000`

4. Stop the server with `Ctrl + C`.

## Controls

- Press `F` to manually add 1 death and trigger more falling pixels.

## Configuration

Most behavior is controlled in `src/sketch.js` under the `CONFIG` object, including:

- `USE_SIMULATED_DATA` (use local simulated deaths)
- `SIM_DEATHS_PER_SEC` (simulation speed)
- `RELEASE_PER_FRAME` (how quickly pixels detach)
- `SHOW_DEBUG` (toggle HUD/debug overlay)

## Backend Hook

When integrating with real data, call:

`window.setDeathsCount(number)`

from your API layer to update the visualization.

## Prompt-driven collaboration

Contributors can run queued tasks and record outcomes under `prompts/`. See `prompts/README.md` and `docs/collaboration/RUNBOOK.md` for the standard flow.
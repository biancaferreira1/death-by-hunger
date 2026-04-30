(() => {
  const CONFIG = {
    SIZE: 400,
    GRID: 10,
    TOTAL_PIXELS: 23000,
    MAX_DROPS: 23000,
    POLL_MS: 10000,
    RELEASE_PER_FRAME: 18,
    GROUND_RATIO: 0.83,
    GRAVITY_RANGE: [0.045, 0.085],
    DRIFT_RANGE: [-0.35, 0.35],
    SWAY_AMP_RANGE: [0, 0],
    SWAY_SPEED_RANGE: [0, 0],
    LAND_BOUNCE_DAMPING: 0.22,
    SHOW_DEBUG: true,
    USE_SIMULATED_DATA: true,
    SIM_DEATHS_PER_SEC: 2.4,
  };

  const STRAW_COLORS = [
    [244, 215, 126],
    [217, 177, 82],
    [146, 102, 41],
  ];
  const OUTLINE_COLOR = [24, 21, 18];

  let canvasW = CONFIG.SIZE;
  let canvasH = CONFIG.SIZE;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;

  let wheatPixels = [];
  let attachedIndices = [];
  let dropQueue = 0;
  let droppedCount = 0;
  let deathsCount = 0;
  let lastPollAt = 0;
  let lastSimAt = 0;

  let groundY = 0;
  let stemRect = {};

  function syncCanvasToWindow(p) {
    canvasW = Math.max(1, Math.floor(p.windowWidth));
    canvasH = Math.max(1, Math.floor(p.windowHeight));
    viewScale = Math.min(canvasW, canvasH) / CONFIG.SIZE;
    viewOffsetX = (canvasW - CONFIG.SIZE * viewScale) * 0.5;
    viewOffsetY = (canvasH - CONFIG.SIZE * viewScale) * 0.5;
  }

  function beginScene(p) {
    p.push();
    p.translate(viewOffsetX, viewOffsetY);
    p.scale(viewScale);
  }

  function endScene(p) {
    p.pop();
  }

  function cellKey(c, r) {
    return `${c},${r}`;
  }

  function toneToColor(tone) {
    if (tone === "light") return STRAW_COLORS[0];
    if (tone === "dark") return STRAW_COLORS[2];
    if (tone === "outline") return OUTLINE_COLOR;
    return STRAW_COLORS[1];
  }

  function buildReferenceWheatCells() {
    // Front-facing wheat icon based on the newer reference image.
    const sprite = [
      "....................",
      ".........omm........",
      "........omllm.......",
      "........mlllm.......",
      ".......omlllm.......",
      ".......mllllm.......",
      "......omllllmo......",
      "......mllllllm......",
      ".....omllllllmo.....",
      ".....mlll|llllm.....",
      "....omll|o|llmo.....",
      "...omlll|o|lllmo....",
      "...mlll|ooo|lllm....",
      "...mll|oooo|lllm....",
      "...oml|oooo|llmo....",
      "....o|ooooo|lmo.....",
      "...oml|o|.|o|lmo....",
      "..omll|.|.|.|llmo...",
      "..mlll|.|.|.|lllm...",
      "..mlll|.|.|.|lllm...",
      "...mll|.|.|.|llm....",
      "...oml|.|.|.|lmo....",
      "....om|.|.|.|mo.....",
      "...oml|.|.|.|lmo....",
      "..omll|.|.|.|llmo...",
      "..mlll|.|.|.|lllm...",
      "...oml|.|.|.|lmo....",
      "....om|.|.|.|mo.....",
      ".....o|.|.|.|o......",
      "......m|.|.|m.......",
      "......m|.|.|m.......",
      "......o|.|.|o.......",
      ".......|.|.|.|......",
      ".......|.|.|.|......",
      ".......|.|.|.|......",
      ".......|.|m|.|......",
    ];

    const fill = new Map();
    const offsetC = 10;
    const offsetR = 2;

    for (let r = 0; r < sprite.length; r++) {
      for (let c = 0; c < sprite[r].length; c++) {
        const ch = sprite[r][c];
        if (ch === ".") continue;
        let tone = "mid";
        if (ch === "l") tone = "light";
        if (ch === "m") tone = "mid";
        if (ch === "o") tone = "dark";
        if (ch === "|") tone = "stem";
        fill.set(cellKey(offsetC + c, offsetR + r), tone);
      }
    }

    const cells = [];
    const occupied = new Set(fill.keys());
    fill.forEach((tone, key) => {
      const [cStr, rStr] = key.split(",");
      const c = Number(cStr);
      const r = Number(rStr);
      if (c < 0 || c >= 40 || r < 0 || r >= 40) return;
      const col =
        tone === "stem" ? STRAW_COLORS[2] : toneToColor(tone);
      cells.push({ c, r, col, isHead: tone !== "stem" });
    });

    // Add 1-cell black outline around the sprite for crisp pixel-art edges.
    const neigh = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1],
    ];
    for (const key of occupied) {
      const [cStr, rStr] = key.split(",");
      const c = Number(cStr);
      const r = Number(rStr);
      for (let i = 0; i < neigh.length; i++) {
        const nc = c + neigh[i][0];
        const nr = r + neigh[i][1];
        if (nc < 0 || nc >= 40 || nr < 0 || nr >= 40) continue;
        const nk = cellKey(nc, nr);
        if (occupied.has(nk)) continue;
        cells.push({ c: nc, r: nr, col: OUTLINE_COLOR, isHead: false });
      }
    }

    return cells;
  }

  function buildWheatPixels(p) {
    const allCells = buildReferenceWheatCells();
    const cellCount = Math.max(1, allCells.length);

    wheatPixels = [];
    attachedIndices = [];

    for (let i = 0; i < CONFIG.TOTAL_PIXELS; i++) {
      const cell = allCells[i % cellCount];
      const jitter = ((i % 3) - 1) * 0.75;
      const anchorX = cell.c * CONFIG.GRID + jitter;
      const anchorY = cell.r * CONFIG.GRID;

      wheatPixels.push({
        anchorX,
        anchorY,
        x: anchorX,
        y: anchorY,
        size: CONFIG.GRID,
        colorAttached: cell.col,
        colorLanded: [122, 102, 76],
        isHead: cell.isHead,
        state: "attached", // attached | falling | landed
        vx: 0,
        vy: 0,
        gravity: p.random(CONFIG.GRAVITY_RANGE[0], CONFIG.GRAVITY_RANGE[1]),
        swayAmp: p.random(CONFIG.SWAY_AMP_RANGE[0], CONFIG.SWAY_AMP_RANGE[1]),
        swaySpeed: p.random(CONFIG.SWAY_SPEED_RANGE[0], CONFIG.SWAY_SPEED_RANGE[1]),
        phase: p.random(p.TWO_PI),
        landedY: groundY - p.random(0, 3),
      });

      attachedIndices.push(i);
    }

    stemRect = {
      x: CONFIG.SIZE * 0.5,
      yBottom: groundY,
      yTop: CONFIG.SIZE * 0.40,
      w: CONFIG.GRID * 3,
    };
  }

  function remapAttachedAnchors(p) {
    const prevStates = wheatPixels.map((px) => ({
      state: px.state,
      x: px.x,
      y: px.y,
      vx: px.vx,
      vy: px.vy,
    }));

    buildWheatPixels(p);

    for (let i = 0; i < wheatPixels.length; i++) {
      const prev = prevStates[i];
      if (!prev) continue;
      wheatPixels[i].state = prev.state;
      if (prev.state === "falling" || prev.state === "landed") {
        wheatPixels[i].x = prev.x;
        wheatPixels[i].y = prev.y;
        wheatPixels[i].vx = prev.vx;
        wheatPixels[i].vy = prev.vy;
      }
    }

    attachedIndices = [];
    for (let i = 0; i < wheatPixels.length; i++) {
      if (wheatPixels[i].state === "attached") attachedIndices.push(i);
    }

    droppedCount = CONFIG.TOTAL_PIXELS - attachedIndices.length;
    dropQueue = Math.max(0, Math.min(deathsCount, CONFIG.MAX_DROPS) - droppedCount);
  }

  function setDeathsCount(nextDeaths) {
    const safe = Math.max(0, Math.floor(Number(nextDeaths) || 0));
    deathsCount = Math.min(safe, CONFIG.MAX_DROPS);

    const targetDropped = Math.min(deathsCount, CONFIG.MAX_DROPS);
    const needed = targetDropped - droppedCount - dropQueue;
    if (needed > 0) dropQueue += needed;
  }

  function releaseDropsStep(p) {
    if (dropQueue <= 0 || attachedIndices.length === 0) return;
    const n = Math.min(CONFIG.RELEASE_PER_FRAME, dropQueue, attachedIndices.length);

    for (let k = 0; k < n; k++) {
      const pick = Math.floor(p.random(attachedIndices.length));
      const idx = attachedIndices[pick];
      attachedIndices[pick] = attachedIndices[attachedIndices.length - 1];
      attachedIndices.pop();

      const px = wheatPixels[idx];
      px.state = "falling";
      px.vx = p.random(CONFIG.DRIFT_RANGE[0], CONFIG.DRIFT_RANGE[1]);
      px.vy = p.random(0.1, 0.5);
    }

    dropQueue -= n;
    droppedCount += n;
  }

  function updatePixelsPhysics(p) {
    const t = p.frameCount;
    for (let i = 0; i < wheatPixels.length; i++) {
      const px = wheatPixels[i];

      if (px.state === "attached") {
        // Keep wheat still while attached.
        px.x = px.anchorX;
        px.y = px.anchorY;
        continue;
      }

      if (px.state === "falling") {
        px.vy += px.gravity;
        px.x += px.vx;
        px.y += px.vy;

        if (px.y >= px.landedY) {
          px.y = px.landedY;
          px.vy *= -CONFIG.LAND_BOUNCE_DAMPING;
          px.vx *= 0.65;
          if (Math.abs(px.vy) < 0.12) {
            px.state = "landed";
            px.vx = 0;
            px.vy = 0;
          }
        }
        continue;
      }

      // landed pixels stay fully still
    }
  }

  function drawViewportBackground(p) {
    p.background(34, 43, 56);
    p.noStroke();

    const horizonY = viewOffsetY + CONFIG.SIZE * 0.75 * viewScale;
    const groundTopY = viewOffsetY + groundY * viewScale;

    p.fill(57, 69, 86);
    p.rect(0, horizonY, canvasW, canvasH - horizonY);

    p.fill(78, 70, 59);
    p.rect(0, groundTopY, canvasW, canvasH - groundTopY);
    p.stroke(110, 96, 78, 160);
    p.line(0, groundTopY, canvasW, groundTopY);
    p.noStroke();
  }

  function drawBackground(p) {
    p.noStroke();
    p.fill(57, 69, 86);
    p.rect(0, CONFIG.SIZE * 0.75, CONFIG.SIZE, CONFIG.SIZE * 0.25);
  }

  function drawGround(p) {
    p.fill(78, 70, 59);
    p.rect(0, groundY, CONFIG.SIZE, CONFIG.SIZE - groundY);
    p.stroke(110, 96, 78, 160);
    p.line(0, groundY, CONFIG.SIZE, groundY);
    p.noStroke();
  }

  function drawStem(p) {
    // Stem remains visible even after all head pixels fall.
    p.fill(146, 112, 60);
    p.rectMode(p.CENTER);
    p.rect(
      stemRect.x,
      (stemRect.yBottom + stemRect.yTop) / 2,
      stemRect.w,
      stemRect.yBottom - stemRect.yTop,
      2
    );
    p.fill(176, 140, 80);
    p.rect(
      stemRect.x - stemRect.w * 0.22,
      (stemRect.yBottom + stemRect.yTop) / 2,
      stemRect.w * 0.20,
      stemRect.yBottom - stemRect.yTop,
      1
    );
    p.rectMode(p.CORNER);
  }

  function drawPixels(p) {
    p.noStroke();
    // Pass 1: draw attached + landed pixels first.
    for (let i = 0; i < wheatPixels.length; i++) {
      const px = wheatPixels[i];
      if (px.state === "falling") continue;
      let c = px.colorAttached;
      if (px.state === "landed") c = px.colorLanded;
      p.fill(c[0], c[1], c[2]);
      p.rect(px.x, px.y, px.size, px.size);
    }

    // Pass 2: draw falling pixels last so they remain visible in front.
    for (let i = 0; i < wheatPixels.length; i++) {
      const px = wheatPixels[i];
      if (px.state !== "falling") continue;
      const c = px.colorAttached;
      p.fill(c[0], c[1], c[2]);
      p.rect(px.x, px.y, px.size, px.size);
    }
  }

  function drawHUD(p) {
    if (!CONFIG.SHOW_DEBUG) return;
    p.fill(0, 130);
    p.rect(12, 12, 230, 70, 8);
    p.fill(236, 232, 222);
    p.textSize(12);
    p.textFont("monospace");
    p.text(`deaths:${deathsCount}`, 20, 33);
    p.text(`dropped:${droppedCount}/${CONFIG.MAX_DROPS}`, 20, 50);
    p.text(`attached:${attachedIndices.length}`, 20, 67);
  }

  function simulateDeaths(p) {
    const now = p.millis();
    const dt = (now - lastSimAt) / 1000;
    lastSimAt = now;
    setDeathsCount(deathsCount + CONFIG.SIM_DEATHS_PER_SEC * dt);
  }

  function initScene(p, keepProgress = false) {
    groundY = CONFIG.SIZE * CONFIG.GROUND_RATIO;
    if (!keepProgress) {
      droppedCount = 0;
      deathsCount = 0;
      dropQueue = 0;
      buildWheatPixels(p);
      lastPollAt = p.millis();
      lastSimAt = p.millis();
    } else {
      remapAttachedAnchors(p);
    }
  }

  const sketch = (p) => {
    p.setup = () => {
      syncCanvasToWindow(p);
      p.createCanvas(canvasW, canvasH);
      p.pixelDensity(1);
      p.noStroke();
      initScene(p);

      // Backend hook: call window.setDeathsCount(value) from your API layer.
      window.setDeathsCount = setDeathsCount;
    };

    p.draw = () => {
      drawViewportBackground(p);

      if (CONFIG.USE_SIMULATED_DATA) simulateDeaths(p);

      if (!CONFIG.USE_SIMULATED_DATA && p.millis() - lastPollAt >= CONFIG.POLL_MS) {
        lastPollAt = p.millis();
        // fetchDeathsFromBackend();
      }

      releaseDropsStep(p);
      updatePixelsPhysics(p);

      beginScene(p);
      drawBackground(p);
      drawGround(p);
      drawStem(p);
      drawPixels(p);
      drawHUD(p);
      endScene(p);
    };

    p.windowResized = () => {
      syncCanvasToWindow(p);
      p.resizeCanvas(canvasW, canvasH);
      initScene(p, true);
    };

    p.keyPressed = () => {
      if (p.key === "f" || p.key === "F") {
        setDeathsCount(deathsCount + 1);
        return false;
      }
      return true;
    };
  };

  // eslint-disable-next-line no-new
  new p5(sketch, document.getElementById("app"));
})();


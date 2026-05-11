(() => {
  // =============================================================================
  // API INTEGRATION (backend)
  // When real-time acute starvation data is available, fetch or receive events in
  // your API layer and call triggerDeath() once per reported instance.
  // For local demo only, USE_SIMULATED_DEATHS reproduces the pre–people wheat sketch
  // rate (see simulateDeaths). Turn it off and do not use setInterval when wired to data.
  // =============================================================================

  const CONFIG = {
    SIZE: 400,
    CROWD_SIZE: 100,
    PAD: 18,
    SPRITE_DRAW_W: 2.35,
    DYING_STEP: 0.06,
    /** Max upward speed for souls (dying + ascending), after ramp-up. */
    ASCEND_SPEED: 2,
    /** Added per frame until ASCEND_SPEED; keeps motion from jumping to full speed. */
    ASCEND_ACCEL: 0.035,
    /** One row: cols 0–1 walk (alive), 2–3 walk (dead + halo). */
    SPRITE_COLS: 4,
    SPRITE_ROWS: 1,
    ALIVE_FRAME_COUNT: 2,
    /** Ms per walk frame (shared by crowd so motion stays readable). */
    WALK_FRAME_MS: 220,
    /** Same as wheat-era sketch (continuous dt accumulation in draw, not setInterval). */
    USE_SIMULATED_DEATHS: true,
    SIM_DEATHS_PER_SEC: 2.4,
    /** Alive silhouettes — darker than semi-transparent white ghosts. */
    LIVE_TINT: [68, 68, 68],
    DEAD_TINT: [255, 255, 255],
    /** Alpha for dead (dying / ascending); drawn after alive so they read in front. */
    DEAD_ALPHA: 160,
    /** Ease for alive→dead crossfade (0 = linear). */
    DYING_USE_SMOOTHSTEP: true,
    /** Ms from birth until fully visible; only then age toward death eligibility. */
    SPAWN_FADE_MS: 3200,
    /** Ms fully visible (after fade) before random/API death can apply. */
    MIN_ALIVE_MS: 5000,
  };

  const SPRITE_ROW = 0;

  let canvasW = CONFIG.SIZE;
  let canvasH = CONFIG.SIZE;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;

  let spriteSheet = null;
  /** Per-cell tight crop + feet anchor (sheet px), after nominal grid split. */
  let frameMeta = null;
  /** Pre-multiplied tint per sheet column (tight crop); avoids per-draw tint(). */
  let tintedFrames = null;
  let spriteAspect = 1;

  let lastSimAt = 0;
  let deathAcc = 0;
  /** Set at start of each draw for fade/ddeath eligibility (API may call between frames). */
  let clockMs = 0;

  function precomputeFrameMetadata(img) {
    const cols = CONFIG.SPRITE_COLS;
    const rows = CONFIG.SPRITE_ROWS;
    const cellW = Math.floor(img.width / cols);
    const cellH = Math.floor(img.height / rows);
    img.loadPixels();
    const px = img.pixels;
    const w = img.width;
    const meta = [];
    for (let r = 0; r < rows; r++) {
      meta[r] = [];
      for (let c = 0; c < cols; c++) {
        const baseX = c * cellW;
        const baseY = r * cellH;
        let minX = cellW;
        let minY = cellH;
        let maxX = -1;
        let maxY = -1;
        for (let ly = 0; ly < cellH; ly++) {
          for (let lx = 0; lx < cellW; lx++) {
            const ai = ((baseY + ly) * w + (baseX + lx)) * 4 + 3;
            if (px[ai] > 10) {
              if (lx < minX) minX = lx;
              if (lx > maxX) maxX = lx;
              if (ly < minY) minY = ly;
              if (ly > maxY) maxY = ly;
            }
          }
        }
        if (maxX < minX) {
          meta[r][c] = {
            sx: baseX,
            sy: baseY,
            sw: cellW,
            sh: cellH,
            sfx: cellW * 0.5,
            sfy: cellH * 0.85,
          };
        } else {
          const pad = 1;
          minX = Math.max(0, minX - pad);
          minY = Math.max(0, minY - pad);
          maxX = Math.min(cellW - 1, maxX + pad);
          maxY = Math.min(cellH - 1, maxY + pad);
          const sw = maxX - minX + 1;
          const sh = maxY - minY + 1;
          meta[r][c] = {
            sx: baseX + minX,
            sy: baseY + minY,
            sw,
            sh,
            sfx: (minX + maxX) / 2 - minX,
            sfy: maxY - minY,
          };
        }
      }
    }
    return meta;
  }

  function averageAliveAspect(meta) {
    let sum = 0;
    for (let c = 0; c < CONFIG.ALIVE_FRAME_COUNT; c++) {
      const m = meta[SPRITE_ROW][c];
      sum += m.sh / m.sw;
    }
    return sum / CONFIG.ALIVE_FRAME_COUNT;
  }

  function buildTintedFrames(p) {
    tintedFrames = [];
    for (let c = 0; c < CONFIG.SPRITE_COLS; c++) {
      const m = frameMeta[SPRITE_ROW][c];
      const { sx, sy, sw, sh } = m;
      const buf = p.createGraphics(sw, sh);
      buf.pixelDensity(1);
      const alive = c < CONFIG.ALIVE_FRAME_COUNT;
      const [tr, tg, tb] = alive ? CONFIG.LIVE_TINT : CONFIG.DEAD_TINT;
      const ta = alive ? 255 : CONFIG.DEAD_ALPHA;
      buf.tint(tr, tg, tb, ta);
      buf.image(spriteSheet, 0, 0, sw, sh, sx, sy, sw, sh);
      buf.noTint();
      tintedFrames.push(buf);
    }
  }

  let figures = [];

  function keyBlackTransparent(img, threshold = 18) {
    img.loadPixels();
    const px = img.pixels;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] <= threshold && px[i + 1] <= threshold && px[i + 2] <= threshold) {
        px[i + 3] = 0;
      }
    }
    img.updatePixels();
  }

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

  function personDrawW(size) {
    return size * CONFIG.SPRITE_DRAW_W;
  }

  function personDrawH(size) {
    return personDrawW(size) * spriteAspect;
  }

  function fadeInAt(fig) {
    return Math.min(1, Math.max(0, (clockMs - fig.bornAt) / CONFIG.SPAWN_FADE_MS));
  }

  function isDeathEligible(fig) {
    return (
      fig.state === "alive" &&
      clockMs >= fig.bornAt + CONFIG.SPAWN_FADE_MS + CONFIG.MIN_ALIVE_MS
    );
  }

  function makeFigure(p, bornOffsetMs) {
    const size = p.random(6, 11);
    const dw = personDrawW(size);
    const dh = personDrawH(size);
    const xPad = dw * 0.52;
    const yTop = CONFIG.PAD + dh * 0.58;
    const yBot = CONFIG.SIZE - CONFIG.PAD - dh * 0.52;
    return {
      x: p.random(CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad),
      y: p.random(yTop, Math.max(yTop + 1, yBot)),
      size,
      phase: p.random(p.TWO_PI),
      animOffset: Math.floor(p.random(CONFIG.ALIVE_FRAME_COUNT)),
      bornAt: p.millis() - bornOffsetMs,
      state: "alive",
      fillAmt: 0,
    };
  }

  function initCrowd(p) {
    figures = [];
    for (let i = 0; i < CONFIG.CROWD_SIZE; i++) {
      const stagger = Math.floor(p.random(0, CONFIG.SPAWN_FADE_MS * 2.2));
      figures.push(makeFigure(p, stagger));
    }
  }

  function triggerDeath() {
    const aliveIdx = [];
    for (let i = 0; i < figures.length; i++) {
      if (isDeathEligible(figures[i])) aliveIdx.push(i);
    }
    if (aliveIdx.length === 0) return false;
    const pick = aliveIdx[Math.floor(Math.random() * aliveIdx.length)];
    const fig = figures[pick];
    fig.state = "dying";
    fig.fillAmt = 0;
    fig.ascendVel = 0;
    return true;
  }

  /** Same timing model as the wheat sketch: deaths/sec × delta time (in draw). */
  function simulateDeaths(p) {
    if (!CONFIG.USE_SIMULATED_DEATHS) return;
    const now = p.millis();
    const dt = Math.min(0.25, (now - lastSimAt) / 1000);
    lastSimAt = now;
    deathAcc += CONFIG.SIM_DEATHS_PER_SEC * dt;
    while (deathAcc >= 1) {
      if (!triggerDeath()) break;
      deathAcc -= 1;
    }
  }

  function updateFigures(p) {
    for (let i = figures.length - 1; i >= 0; i--) {
      const fig = figures[i];
      if (fig.state === "dying") {
        fig.fillAmt += CONFIG.DYING_STEP;
        fig.ascendVel = Math.min(CONFIG.ASCEND_SPEED, (fig.ascendVel ?? 0) + CONFIG.ASCEND_ACCEL);
        fig.y -= fig.ascendVel;
        if (fig.fillAmt >= 1) {
          fig.fillAmt = 1;
          fig.state = "ascending";
        }
      } else if (fig.state === "ascending") {
        fig.ascendVel = Math.min(CONFIG.ASCEND_SPEED, (fig.ascendVel ?? 0) + CONFIG.ASCEND_ACCEL);
        fig.y -= fig.ascendVel;
        if (fig.y < -personDrawH(fig.size) * 0.55) {
          figures.splice(i, 1);
          figures.push(makeFigure(p, 0));
        }
      }
    }
  }

  /** 1×4 sheet: walk frames 0–1 alive, 2–3 dead (+ halo). Uses baked tinted textures. */
  function drawPersonSprite(p, fig) {
    if (!tintedFrames || !frameMeta) return;

    const row = SPRITE_ROW;
    const walkTick = Math.floor(p.millis() / CONFIG.WALK_FRAME_MS);
    const stride = CONFIG.ALIVE_FRAME_COUNT;
    const phase = (walkTick + (fig.animOffset ?? 0)) % stride;

    const fi = fadeInAt(fig);
    if (fig.state === "alive" && fi <= 0) return;

    const dw = Math.round(personDrawW(fig.size));
    const dh = Math.round(personDrawH(fig.size));

    p.push();
    p.translate(fig.x, fig.y);
    p.imageMode(p.CENTER);

    if (fig.state === "dying") {
      let u = Math.min(1, Math.max(0, fig.fillAmt));
      if (CONFIG.DYING_USE_SMOOTHSTEP) {
        u = u * u * (3 - 2 * u);
      }
      const drawLayer = (col, alpha) => {
        if (alpha <= 0.002) return;
        const meta = frameMeta[row][col];
        const { sw, sh, sfx, sfy } = meta;
        const cx = dw * (0.5 - sfx / sw);
        const cy = dh * (0.5 - sfy / sh);
        p.tint(255, 255, 255, Math.round(255 * alpha));
        p.image(tintedFrames[col], cx, cy, dw, dh, 0, 0, sw, sh);
      };
      drawLayer(phase, 1 - u);
      drawLayer(stride + phase, u);
      p.noTint();
    } else {
      const col = fig.state === "alive" ? phase : stride + phase;
      const meta = frameMeta[row][col];
      const { sw, sh, sfx, sfy } = meta;
      const cx = dw * (0.5 - sfx / sw);
      const cy = dh * (0.5 - sfy / sh);
      const tex = tintedFrames[col];

      if (fig.state === "alive" && fi < 1) {
        p.tint(255, 255, 255, Math.round(255 * fi));
      }

      p.image(tex, cx, cy, dw, dh, 0, 0, sw, sh);

      if (fig.state === "alive" && fi < 1) {
        p.noTint();
      }
    }

    p.pop();
  }

  function remapCrowd(p) {
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      const dw = personDrawW(fig.size);
      const dh = personDrawH(fig.size);
      const xPad = dw * 0.52;
      const yTop = CONFIG.PAD + dh * 0.58;
      const yBot = CONFIG.SIZE - CONFIG.PAD - dh * 0.52;
      fig.x = p.constrain(fig.x, CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad);
      fig.y = p.constrain(fig.y, yTop, Math.max(yTop + 1, yBot));
    }
  }

  const sketch = (p) => {
    p.preload = () => {
      spriteSheet = p.loadImage("assets/person-sprites-4.png");
    };

    p.setup = () => {
      syncCanvasToWindow(p);
      p.createCanvas(canvasW, canvasH);
      p.pixelDensity(1);
      keyBlackTransparent(spriteSheet);
      frameMeta = precomputeFrameMetadata(spriteSheet);
      spriteAspect = averageAliveAspect(frameMeta);
      buildTintedFrames(p);
      initCrowd(p);
      lastSimAt = p.millis();
      deathAcc = 0;

      window.triggerDeath = triggerDeath;
    };

    p.draw = () => {
      p.background(0);

      clockMs = p.millis();

      simulateDeaths(p);
      updateFigures(p);

      beginScene(p);
      for (let i = 0; i < figures.length; i++) {
        if (figures[i].state === "alive") drawPersonSprite(p, figures[i]);
      }
      for (let i = 0; i < figures.length; i++) {
        if (figures[i].state !== "alive") drawPersonSprite(p, figures[i]);
      }
      endScene(p);
    };

    p.windowResized = () => {
      syncCanvasToWindow(p);
      p.resizeCanvas(canvasW, canvasH);
      remapCrowd(p);
    };

    p.keyPressed = () => {
      if (p.key === "d" || p.key === "D") {
        triggerDeath();
        return false;
      }
      return true;
    };
  };

  // eslint-disable-next-line no-new
  new p5(sketch, document.getElementById("app"));
})();

(() => {
  // =============================================================================
  // API INTEGRATION (backend)
  // When real-time acute starvation data is available, fetch or receive events in
  // your API layer and call triggerDeath() once per reported instance.
  // For local demo only, USE_SIMULATED_DEATHS uses SIM_DEATHS_PER_SEC (see CONFIG). Turn it off
  // and do not use setInterval when wired to data.
  // =============================================================================

  const CONFIG = {
    /** Reference edge length for scaling (layout uses full window; sizes track min side / this). */
    SIZE: 400,
    CROWD_SIZE: 300,
    PAD: 18,
    SPRITE_DRAW_W: 2.35,
    /** Ms off-screen before same slot respawns at bottom (frame-based, not setTimeout). */
    EXIT_DORMANT_MS: 3000,
    /** Max upward speed while exiting; ramps from ASCEND_ACCEL. */
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
    /**
     * Demo-only: ~1 death / 3.47 s on average. Back-of-envelope: 9.1M/year → ~24,931/day →
     * ~1,038/h → ~17.3/min → 60÷17.3 ≈ 3.47 s between deaths (pedagogical order of magnitude).
     */
    SIM_DEATHS_PER_SEC: 17.3 / 60,
    /** Alive silhouettes — darker than semi-transparent white ghosts. */
    LIVE_TINT: [68, 68, 68],
    DEAD_TINT: [255, 255, 255],
    /** Alpha for exiting (dead+halo) sprites; drawn after alive so they read in front. */
    DEAD_ALPHA: 160,
    /** Ms from birth until fully visible; only then age toward death eligibility. */
    SPAWN_FADE_MS: 3200,
    /** Ms fully visible (after fade) before random/API death can apply. */
    MIN_ALIVE_MS: 5000,
  };

  const SPRITE_ROW = 0;

  let canvasW = CONFIG.SIZE;
  let canvasH = CONFIG.SIZE;

  let spriteSheet = null;
  /** Per-cell tight crop + feet anchor (sheet px), after nominal grid split. */
  let frameMeta = null;
  /** Pre-multiplied tint per sheet column (tight crop); avoids per-draw tint(). */
  let tintedFrames = null;
  let spriteAspect = 1;

  let lastSimAt = 0;
  let deathAcc = 0;
  /** Set at start of each draw for fade / dormant / death eligibility (API may call between frames). */
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

  function layoutScale() {
    return Math.min(canvasW, canvasH) / CONFIG.SIZE;
  }

  function syncCanvasToWindow(p) {
    canvasW = Math.max(1, Math.floor(p.windowWidth));
    canvasH = Math.max(1, Math.floor(p.windowHeight));
  }

  function beginScene(p) {
    p.push();
  }

  function endScene(p) {
    p.pop();
  }

  function personDrawW(size) {
    return size * CONFIG.SPRITE_DRAW_W * layoutScale();
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

  function resetFigureToCrowd(p, fig) {
    fig.size = p.random(6, 11);
    fig.phase = p.random(p.TWO_PI);
    fig.animOffset = Math.floor(p.random(CONFIG.ALIVE_FRAME_COUNT));
    fig.bornAt = p.millis();
    const dw = personDrawW(fig.size);
    const dh = personDrawH(fig.size);
    const xPad = dw * 0.52;
    const yTop = CONFIG.PAD + dh * 0.58;
    const yBot = canvasH - CONFIG.PAD - dh * 0.52;
    const mid = yTop + (yBot - yTop) * 0.5;
    const yLo = Math.max(mid, yTop + 1);
    fig.x = p.random(CONFIG.PAD + xPad, canvasW - CONFIG.PAD - xPad);
    fig.y = p.random(yLo, Math.max(yLo + 1, yBot));
  }

  function makeFigure(p, bornOffsetMs) {
    const size = p.random(6, 11);
    const dw = personDrawW(size);
    const dh = personDrawH(size);
    const xPad = dw * 0.52;
    const yTop = CONFIG.PAD + dh * 0.58;
    const yBot = canvasH - CONFIG.PAD - dh * 0.52;
    return {
      x: p.random(CONFIG.PAD + xPad, canvasW - CONFIG.PAD - xPad),
      y: p.random(yTop, Math.max(yTop + 1, yBot)),
      size,
      phase: p.random(p.TWO_PI),
      animOffset: Math.floor(p.random(CONFIG.ALIVE_FRAME_COUNT)),
      bornAt: p.millis() - bornOffsetMs,
      state: "alive",
      ascendVel: 0,
      dormantWakeAt: null,
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
    fig.state = "exiting";
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
    const ms = layoutScale();
    const vCap = CONFIG.ASCEND_SPEED * ms;
    const vAccel = CONFIG.ASCEND_ACCEL * ms;
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      if (fig.state === "exiting") {
        fig.ascendVel = Math.min(vCap, (fig.ascendVel ?? 0) + vAccel);
        fig.y -= fig.ascendVel;
        if (fig.y < 0) {
          fig.state = "dormant";
          fig.ascendVel = 0;
          fig.dormantWakeAt = clockMs + CONFIG.EXIT_DORMANT_MS;
        }
      } else if (fig.state === "dormant") {
        if (fig.dormantWakeAt != null && clockMs >= fig.dormantWakeAt) {
          fig.dormantWakeAt = null;
          fig.state = "alive";
          resetFigureToCrowd(p, fig);
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

    if (fig.state === "dormant") return;

    const fi = fadeInAt(fig);
    if (fig.state === "alive" && fi <= 0) return;

    const dw = Math.round(personDrawW(fig.size));
    const dh = Math.round(personDrawH(fig.size));

    p.push();
    p.translate(fig.x, fig.y);
    p.imageMode(p.CENTER);

    const col =
      fig.state === "alive" ? phase : stride + phase;
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

    p.pop();
  }

  function remapCrowd(p, prevW, prevH) {
    const hasPrev = prevW > 0 && prevH > 0;
    const sx = hasPrev ? canvasW / prevW : 1;
    const sy = hasPrev ? canvasH / prevH : 1;

    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      const dw = personDrawW(fig.size);
      const dh = personDrawH(fig.size);
      const xPad = dw * 0.52;
      const yTop = CONFIG.PAD + dh * 0.58;
      const yBot = canvasH - CONFIG.PAD - dh * 0.52;

      if (fig.state === "alive") {
        fig.x = p.random(CONFIG.PAD + xPad, canvasW - CONFIG.PAD - xPad);
        fig.y = p.random(yTop, Math.max(yTop + 1, yBot));
      } else if (fig.state === "exiting" || fig.state === "dormant") {
        if (hasPrev) {
          fig.x *= sx;
          fig.y *= sy;
        }
        fig.x = p.constrain(fig.x, CONFIG.PAD + xPad, canvasW - CONFIG.PAD - xPad);
      }
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
        if (figures[i].state === "exiting") drawPersonSprite(p, figures[i]);
      }
      endScene(p);
    };

    p.windowResized = () => {
      const prevW = canvasW;
      const prevH = canvasH;
      syncCanvasToWindow(p);
      p.resizeCanvas(canvasW, canvasH);
      remapCrowd(p, prevW, prevH);
    };

    p.keyPressed = () => {
      if (p.key === "d" || p.key === "D") {
        triggerDeath();
        return false;
      }
      if (p.key === "f" || p.key === "F") {
        p.fullscreen(!p.fullscreen());
        return false;
      }
      return true;
    };
  };

  // eslint-disable-next-line no-new
  new p5(sketch, document.getElementById("app"));
})();

(() => {
  // =============================================================================
  // API INTEGRATION (backend)
  // When real-time acute starvation data is available, fetch or receive events in
  // your API layer and call triggerDeath() once per reported instance. Do not
  // drive deaths with timers or setInterval—only react to real API data.
  // =============================================================================

  const CONFIG = {
    SIZE: 400,
    CROWD_SIZE: 300,
    PAD: 18,
    SPRITE_DRAW_W: 2.35,
    DYING_STEP: 0.06,
    ASCEND_SPEED: 5,
    SPRITE_COLS: 8,
    SPRITE_ROWS: 5,
    /** Ms per walk frame (shared by crowd so motion stays readable). */
    WALK_FRAME_MS: 220,
  };

  const ROW_WALK_RIGHT = 0;
  const ROW_WALK_LEFT = 1;
  const ROW_WALK_UP = 2;
  const ROW_WALK_DOWN = 3;
  const ROW_SPAWN_DIE = 4;

  let canvasW = CONFIG.SIZE;
  let canvasH = CONFIG.SIZE;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;

  let spriteSheet = null;
  let spriteFrameW = 1;
  let spriteFrameH = 1;
  let spriteAspect = 1;

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

  function initCrowd(p) {
    figures = [];
    for (let i = 0; i < CONFIG.CROWD_SIZE; i++) {
      const size = p.random(6, 11);
      const dw = personDrawW(size);
      const dh = personDrawH(size);
      const xPad = dw * 0.52;
      const yTop = CONFIG.PAD + dh * 0.58;
      const yBot = CONFIG.SIZE - CONFIG.PAD - dh * 0.52;
      figures.push({
        x: p.random(CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad),
        y: p.random(yTop, Math.max(yTop + 1, yBot)),
        size,
        phase: p.random(p.TWO_PI),
        animOffset: Math.floor(p.random(CONFIG.SPRITE_COLS)),
        state: "alive",
        fillAmt: 0,
      });
    }
  }

  function triggerDeath() {
    const aliveIdx = [];
    for (let i = 0; i < figures.length; i++) {
      if (figures[i].state === "alive") aliveIdx.push(i);
    }
    if (aliveIdx.length === 0) return;
    const pick = aliveIdx[Math.floor(Math.random() * aliveIdx.length)];
    const fig = figures[pick];
    fig.state = "dying";
    fig.fillAmt = 0;
  }

  function updateFigures() {
    for (let i = figures.length - 1; i >= 0; i--) {
      const fig = figures[i];
      if (fig.state === "dying") {
        fig.fillAmt += CONFIG.DYING_STEP;
        if (fig.fillAmt >= 1) {
          fig.fillAmt = 1;
          fig.state = "ascending";
        }
      } else if (fig.state === "ascending") {
        fig.y -= CONFIG.ASCEND_SPEED;
        if (fig.y < -personDrawH(fig.size) * 0.55) {
          figures.splice(i, 1);
        }
      }
    }
  }

  /** 8×5 spritesheet: rows = walk R/L/up/down, spawn/die. Drawn one frame per figure. */
  function drawPersonSprite(p, fig) {
    if (!spriteSheet || spriteSheet.width <= 0) return;

    const fw = spriteFrameW;
    const fh = spriteFrameH;
    let row = ROW_WALK_DOWN;
    let col = 0;

    const walkTick = Math.floor(p.millis() / CONFIG.WALK_FRAME_MS);

    if (fig.state === "alive") {
      row = ROW_WALK_DOWN;
      col = (walkTick + (fig.animOffset ?? 0)) % CONFIG.SPRITE_COLS;
    } else if (fig.state === "dying") {
      row = ROW_SPAWN_DIE;
      col = Math.min(CONFIG.SPRITE_COLS - 1, Math.floor(fig.fillAmt * CONFIG.SPRITE_COLS));
    } else {
      row = ROW_WALK_UP;
      col = (walkTick + (fig.animOffset ?? 0)) % CONFIG.SPRITE_COLS;
    }

    const sx = Math.floor(col * fw);
    const sy = Math.floor(row * fh);
    const dw = Math.round(personDrawW(fig.size));
    const dh = Math.round(personDrawH(fig.size));

    p.push();
    p.translate(fig.x, fig.y);
    p.imageMode(p.CENTER);

    if (fig.state === "dying") {
      const g = p.lerp(255, 0, fig.fillAmt);
      p.tint(g, g, g, 255);
    } else if (fig.state === "ascending") {
      p.tint(245, 245, 245, 255);
    } else {
      p.noTint();
    }

    p.image(spriteSheet, 0, 0, dw, dh, sx, sy, fw, fh);
    p.noTint();
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
      spriteSheet = p.loadImage("assets/person-sprites.png");
    };

    p.setup = () => {
      syncCanvasToWindow(p);
      p.createCanvas(canvasW, canvasH);
      p.pixelDensity(1);
      spriteFrameW = Math.floor(spriteSheet.width / CONFIG.SPRITE_COLS);
      spriteFrameH = Math.floor(spriteSheet.height / CONFIG.SPRITE_ROWS);
      spriteAspect = spriteFrameH / spriteFrameW;
      keyBlackTransparent(spriteSheet);
      initCrowd(p);

      window.triggerDeath = triggerDeath;
    };

    p.draw = () => {
      p.background(255);

      updateFigures();

      beginScene(p);
      for (let i = 0; i < figures.length; i++) {
        drawPersonSprite(p, figures[i]);
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

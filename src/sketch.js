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
    /** Display width multiplier relative to fig.size (asset scales proportionally). */
    PERSON_DRAW_W: 2.2,
    /** Inner fill lerp per frame while dying (white → black). */
    DYING_STEP: 0.06,
    /** Upward motion after inner fill is black. */
    ASCEND_SPEED: 5,
  };

  let canvasW = CONFIG.SIZE;
  let canvasH = CONFIG.SIZE;
  let viewScale = 1;
  let viewOffsetX = 0;
  let viewOffsetY = 0;

  let personImg = null;
  let personAspect = 1;

  let figures = [];

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
    return size * CONFIG.PERSON_DRAW_W;
  }

  function personDrawH(size) {
    return personDrawW(size) * personAspect;
  }

  function initCrowd(p) {
    figures = [];
    for (let i = 0; i < CONFIG.CROWD_SIZE; i++) {
      const size = p.random(6, 11);
      const dw = personDrawW(size);
      const dh = personDrawH(size);
      const xPad = dw * 0.5;
      const yTop = CONFIG.PAD + dh * 0.52;
      const yBot = CONFIG.SIZE - CONFIG.PAD - dh * 0.52;
      figures.push({
        x: p.random(CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad),
        y: p.random(yTop, Math.max(yTop + 1, yBot)),
        size,
        phase: p.random(p.TWO_PI),
        state: "alive",
        fillAmt: 0,
      });
    }
  }

  /**
   * Call once per acute-starvation event from the API. Never call from a timer.
   */
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
        if (fig.y < -personDrawH(fig.size) * 0.65) {
          figures.splice(i, 1);
        }
      }
    }
  }

  /** Person sprite (`assets/person.svg`): transparent background, drawn with `image()`. */
  function drawPersonAsset(p, fig) {
    if (!personImg || personImg.width <= 0) return;

    const breath =
      fig.state === "alive"
        ? 1 + 0.035 * Math.sin(p.millis() * 0.0012 + fig.phase)
        : 1;

    const dw = personDrawW(fig.size);
    const dh = personDrawH(fig.size);

    p.push();
    p.translate(fig.x, fig.y);
    p.scale(breath);
    p.imageMode(p.CENTER);

    if (fig.state === "alive") {
      p.noTint();
    } else if (fig.state === "dying") {
      const g = p.lerp(255, 0, fig.fillAmt);
      p.tint(g, g, g);
    } else {
      p.tint(0, 0, 0);
    }

    p.image(personImg, 0, 0, dw, dh);
    p.noTint();
    p.pop();
  }

  function remapCrowd(p) {
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      const dw = personDrawW(fig.size);
      const dh = personDrawH(fig.size);
      const xPad = dw * 0.5;
      const yTop = CONFIG.PAD + dh * 0.52;
      const yBot = CONFIG.SIZE - CONFIG.PAD - dh * 0.52;
      fig.x = p.constrain(fig.x, CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad);
      fig.y = p.constrain(
        fig.y,
        yTop,
        Math.max(yTop + 1, yBot)
      );
    }
  }

  const sketch = (p) => {
    p.preload = () => {
      personImg = p.loadImage("assets/person.svg");
    };

    p.setup = () => {
      syncCanvasToWindow(p);
      p.createCanvas(canvasW, canvasH);
      p.pixelDensity(1);
      personAspect = personImg.height / personImg.width;
      initCrowd(p);

      window.triggerDeath = triggerDeath;
    };

    p.draw = () => {
      p.background(255);

      updateFigures();

      beginScene(p);
      for (let i = 0; i < figures.length; i++) {
        drawPersonAsset(p, figures[i]);
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

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

  function initCrowd(p) {
    figures = [];
    for (let i = 0; i < CONFIG.CROWD_SIZE; i++) {
      figures.push({
        x: p.random(CONFIG.PAD, CONFIG.SIZE - CONFIG.PAD),
        y: p.random(CONFIG.PAD, CONFIG.SIZE - CONFIG.PAD),
        size: p.random(7, 13),
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
        if (fig.y < -fig.size * 4) {
          figures.splice(i, 1);
        }
      }
    }
  }

  function drawStickFigure(p, fig) {
    const s = fig.size;
    const breath =
      fig.state === "alive"
        ? 1 + 0.035 * Math.sin(p.millis() * 0.0012 + fig.phase)
        : 1;

    let fillC = 255;
    if (fig.state === "dying") {
      fillC = p.lerp(255, 0, fig.fillAmt);
    } else if (fig.state === "ascending") {
      fillC = 0;
    }

    p.push();
    p.translate(fig.x, fig.y);
    p.scale(breath);

    p.stroke(0);
    p.strokeWeight(Math.max(1.2, s * 0.11));
    p.fill(fillC);

    p.circle(0, -s * 1.15, s * 0.88);
    p.line(0, -s * 0.82, 0, s * 0.42);
    p.line(0, -s * 0.18, -s * 0.55, s * 0.08);
    p.line(0, -s * 0.18, s * 0.55, s * 0.08);
    p.line(0, s * 0.42, -s * 0.48, s * 1.18);
    p.line(0, s * 0.42, s * 0.48, s * 1.18);

    p.pop();
  }

  function remapCrowd(p) {
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      fig.x = p.constrain(fig.x, CONFIG.PAD, CONFIG.SIZE - CONFIG.PAD);
      fig.y = p.constrain(fig.y, CONFIG.PAD, CONFIG.SIZE - CONFIG.PAD);
    }
  }

  const sketch = (p) => {
    p.setup = () => {
      syncCanvasToWindow(p);
      p.createCanvas(canvasW, canvasH);
      p.pixelDensity(1);
      initCrowd(p);

      window.triggerDeath = triggerDeath;
    };

    p.draw = () => {
      p.background(255);

      updateFigures();

      beginScene(p);
      for (let i = 0; i < figures.length; i++) {
        drawStickFigure(p, figures[i]);
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

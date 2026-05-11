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
    DYING_STEP: 0.06,
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
      const size = p.random(6, 11);
      const xPad = size * 0.52;
      const yTop = CONFIG.PAD + size * 1.22;
      const yBot = CONFIG.SIZE - CONFIG.PAD - size * 0.92;
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
        if (fig.y < -fig.size * 2.2) {
          figures.splice(i, 1);
        }
      }
    }
  }

  /**
   * Pill torso (domed shoulder line, straight sides, small foot) plus round head
   * and thick arms hanging from the upper sides — one closed path.
   */
  function drawPersonIcon(p, fig) {
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

    const sw = Math.max(1.75, s * 0.16);
    const w = 0.31 * s;
    const headCy = -0.9 * s;
    const headR = 0.225 * s;
    const domeTop = -0.52 * s;
    const ySideTop = -0.32 * s;
    const ySideBot = 0.55 * s;
    const yToe = 0.7 * s;

    p.push();
    p.translate(fig.x, fig.y);
    p.scale(breath);

    p.noStroke();
    p.fill(0);
    p.rectMode(p.CENTER);
    p.rect(0, yToe + s * 0.04, s * 0.22, s * 0.1, s * 0.03);

    p.stroke(0);
    p.strokeWeight(sw);
    p.strokeJoin(p.ROUND);
    p.strokeCap(p.ROUND);
    p.fill(fillC);
    p.rectMode(p.CORNER);

    p.beginShape();
    p.vertex(0, headCy - headR);
    p.bezierVertex(
      headR * 1.12,
      headCy - headR * 0.88,
      headR * 1.08,
      headCy + headR * 0.35,
      w,
      headCy + headR * 0.9
    );
    p.bezierVertex(
      w * 1.02,
      (headCy + headR + domeTop) * 0.5,
      w * 0.65,
      ySideTop - s * 0.08,
      w,
      ySideTop
    );
    p.bezierVertex(
      w + s * 0.12,
      ySideTop + s * 0.06,
      w + s * 0.18,
      s * 0.12,
      w + s * 0.15,
      s * 0.4
    );
    p.bezierVertex(
      w + s * 0.1,
      s * 0.52,
      w + s * 0.02,
      s * 0.48,
      w,
      s * 0.18
    );
    p.vertex(w, ySideBot);
    p.bezierVertex(
      w * 0.88,
      ySideBot + s * 0.11,
      s * 0.1,
      ySideBot + s * 0.13,
      0,
      yToe
    );
    p.bezierVertex(
      -s * 0.1,
      ySideBot + s * 0.13,
      -w * 0.88,
      ySideBot + s * 0.11,
      -w,
      ySideBot
    );
    p.vertex(-w, s * 0.18);
    p.bezierVertex(
      -w - s * 0.02,
      s * 0.48,
      -w - s * 0.1,
      s * 0.52,
      -w - s * 0.15,
      s * 0.4
    );
    p.bezierVertex(
      -w - s * 0.18,
      s * 0.12,
      -w - s * 0.12,
      ySideTop + s * 0.06,
      -w,
      ySideTop
    );
    p.bezierVertex(
      -w * 0.65,
      ySideTop - s * 0.08,
      -w * 1.02,
      (headCy + headR + domeTop) * 0.5,
      -w,
      headCy + headR * 0.9
    );
    p.bezierVertex(
      -headR * 1.08,
      headCy + headR * 0.35,
      -headR * 1.12,
      headCy - headR * 0.88,
      0,
      headCy - headR
    );
    p.endShape(p.CLOSE);

    p.pop();
  }

  function remapCrowd(p) {
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      const xPad = fig.size * 0.52;
      const yTop = CONFIG.PAD + fig.size * 1.22;
      const yBot = CONFIG.SIZE - CONFIG.PAD - fig.size * 0.92;
      fig.x = p.constrain(fig.x, CONFIG.PAD + xPad, CONFIG.SIZE - CONFIG.PAD - xPad);
      fig.y = p.constrain(fig.y, yTop, Math.max(yTop + 1, yBot));
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
        drawPersonIcon(p, figures[i]);
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

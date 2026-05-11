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
      const xPad = size * 0.58;
      const yTop = CONFIG.PAD + size * 1.28;
      const yBot = CONFIG.SIZE - CONFIG.PAD - size * 1.05;
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
        if (fig.y < -fig.size * 2.35) {
          figures.splice(i, 1);
        }
      }
    }
  }

  /**
   * Reference-style silhouette: vertical oval head blending into rounded shoulders,
   * rectangular torso, inverted-U crotch, tapered legs with rounded feet, and
   * separate pill arms with a narrow gap from the torso.
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

    const sw = Math.max(1.6, s * 0.13);

    const headCy = -1.02 * s;
    const headRx = 0.165 * s;
    const headRy = 0.21 * s;
    const wSh = 0.33 * s;
    const wWa = 0.29 * s;
    const yWa = -0.02 * s;
    const wHi = 0.31 * s;
    const yHi = 0.06 * s;
    const yThighTop = 0.2 * s;
    const xLegOutT = 0.26 * s;
    const xLegOutA = 0.2 * s;
    const footY = 1.08 * s;
    const yCrotchInner = 0.26 * s;

    const gap = 0.04 * s;
    const armW = 0.095 * s;
    const armY1 = -0.64 * s;
    const armY2 = 0.34 * s;
    const armCx = wSh + gap + armW * 0.5;
    const armMidY = (armY1 + armY2) * 0.5;

    p.push();
    p.translate(fig.x, fig.y);
    p.scale(breath);

    p.stroke(0);
    p.strokeWeight(sw);
    p.strokeJoin(p.ROUND);
    p.strokeCap(p.ROUND);
    p.fill(fillC);

    p.beginShape();
    p.vertex(0, headCy - headRy);
    p.bezierVertex(
      headRx * 1.28,
      headCy - headRy * 0.9,
      headRx * 1.18,
      headCy + headRy * 0.45,
      wSh,
      headCy + headRy * 0.82
    );
    p.bezierVertex(
      wSh * 1.03,
      headCy + headRy * 0.92,
      wWa * 1.06,
      yWa - s * 0.1,
      wWa,
      yWa
    );
    p.bezierVertex(
      wHi * 1.02,
      yWa + s * 0.06,
      xLegOutT,
      yHi,
      xLegOutT,
      yThighTop
    );
    p.bezierVertex(
      xLegOutT * 0.97,
      footY - s * 0.22,
      xLegOutA,
      footY,
      xLegOutA * 0.42,
      footY
    );
    p.bezierVertex(
      0.05 * s,
      footY - s * 0.03,
      0.048 * s,
      0.38 * s,
      0,
      yCrotchInner
    );
    p.bezierVertex(
      -0.048 * s,
      0.38 * s,
      -0.05 * s,
      footY - s * 0.03,
      -xLegOutA * 0.42,
      footY
    );
    p.bezierVertex(
      -xLegOutA,
      footY,
      -xLegOutT * 0.97,
      footY - s * 0.22,
      -xLegOutT,
      yThighTop
    );
    p.bezierVertex(
      -xLegOutT,
      yHi,
      -wHi * 1.02,
      yWa + s * 0.06,
      -wWa,
      yWa
    );
    p.bezierVertex(
      -wWa * 1.06,
      yWa - s * 0.1,
      -wSh * 1.03,
      headCy + headRy * 0.92,
      -wSh,
      headCy + headRy * 0.82
    );
    p.bezierVertex(
      -headRx * 1.18,
      headCy + headRy * 0.45,
      -headRx * 1.28,
      headCy - headRy * 0.9,
      0,
      headCy - headRy
    );
    p.endShape(p.CLOSE);

    p.rectMode(p.CENTER);
    p.rect(armCx, armMidY, armW, armY2 - armY1, armW * 0.5);
    p.rect(-armCx, armMidY, armW, armY2 - armY1, armW * 0.5);
    p.rectMode(p.CORNER);

    p.pop();
  }

  function remapCrowd(p) {
    for (let i = 0; i < figures.length; i++) {
      const fig = figures[i];
      const xPad = fig.size * 0.58;
      const yTop = CONFIG.PAD + fig.size * 1.28;
      const yBot = CONFIG.SIZE - CONFIG.PAD - fig.size * 1.05;
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

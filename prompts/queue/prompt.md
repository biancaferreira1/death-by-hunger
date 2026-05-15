# Task: change-to-people

## Goal

Create a p5.js sketch of a "sea of people" by initializing a crowd of 300 stick figures randomly distributed across the canvas. The style must feature a pure white background where every figure has a permanent black outline and a white inner fill with no text or UI elements present. You should add a very slight "idle" breathing animation to the figures so the crowd feels like a living sea. The death logic must be reactive, centered around a global function called triggerDeath() which is important to note should not be called by a timer or setInterval and must only execute when manually called. When triggerDeath() is called, the script should pick one random figure that is currently "alive" with a white fill and transition its inner fill from white to black. Once the fill is black, the figure maintains its black outline and floats upward off the screen, and you must remove the figure from the array once it is off-canvas. For backend and API preparation, leave a clearly marked section at the top of the script for the API integration where the backend logic will eventually fetch real-time data and call triggerDeath() whenever the API reports a new instance of acute starvation. For testing purposes only, map the "D" key to call triggerDeath() so that the animation works and can be verified without a timer.

## Follow-up (moved to queue)

An extension was mistakenly appended here under `runs/` (author extensions in **`prompts/queue/`** only). It is tracked as task **`2026-05-12-recycle-crowd-pool`**.

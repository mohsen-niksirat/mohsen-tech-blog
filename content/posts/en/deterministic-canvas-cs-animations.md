---
slug: deterministic-canvas-cs-animations
title: "Teaching Algorithms with Deterministic Canvas Engines: Inside CodeVis"
date: 2026-09-22
topic: Learning Engines
tags: [HTML5 Canvas, Algorithms, CS Education, Zero Dependencies, Architecture]
summary: "How CodeVis packs 49 interactive computer science visualizations, synchronized code stepping, and PNG export cards into a single zero-dependency HTML file."
diagram: canvas-timeline
featured: false
projectName: "CodeVis"
projectRepo: "https://github.com/mohsen-niksirat/CodeVis"
projectLive: "https://mohsen-niksirat.github.io/CodeVis/"
---

Most algorithm visualizers online fall into one of two traps: either they play a pre-rendered video where you cannot inspect variables, or they mutate live DOM nodes inside `setTimeout` loops that break the instant you try stepping backward.

When designing **[CodeVis](https://mohsen-niksirat.github.io/CodeVis/)** to teach 49 computer science concepts (spanning sorting, graph traversal, trees, dynamic programming, networking handshakes, and design patterns), I wanted two guarantees: **instant bidirectional scrubbing** and **single-file portability** (zero npm dependencies, works offline from a USB drive or browser tab).

{{DIAGRAM}}

## Decoupling Execution from Rendering via Immutable Step Tapes

The cleanest way to make any algorithm reversible is never to animate inside the algorithm itself. Instead, each algorithm runs synchronously to completion once on a small input ($N \le 32$), emitting an array of immutable **Step Snapshots**:

```javascript
export function recordBinarySearch(sortedArray, target) {
  const tape = [];
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const value = sortedArray[mid];

    tape.push({
      line: 4,
      vars: { low, mid, high, probe: value, target },
      highlights: { range: [low, high], pivot: mid },
      caption: `Probe index ${mid} (value ${value}) against target ${target}.`,
    });

    if (value === target) {
      tape.push({
        line: 6,
        vars: { low, mid, high, foundAt: mid },
        highlights: { found: mid },
        caption: `Target ${target} matched at index ${mid}.`,
      });
      return tape;
    }

    if (value < target) low = mid + 1;
    else high = mid - 1;
  }

  tape.push({ line: 11, vars: { low, high, foundAt: -1 }, highlights: {}, caption: "Target absent." });
  return tape;
}
```

Once `tape` exists in memory, the player UI becomes a pure function `render(tape[stepIndex], interpolationAlpha)`:

* Clicking **Step Back** simply decrements `stepIndex` with zero state corruption.
* Dragging the timeline scrubber jumps to any frame in $O(1)$ time.
* The code pane highlights `tape[stepIndex].line` and renders `tape[stepIndex].vars` in exact lockstep with the HTML5 Canvas drawing.

## Crisp High-DPI Canvas Rendering

Blurry text on Retina and Windows 125%/150% fractional-scaling laptops ruins technical diagrams. Scaling the backing bitmap by `window.devicePixelRatio` while keeping layout math in logical CSS pixels keeps node labels razor-sharp everywhere:

```javascript
export function resizeHiDpiCanvas(canvas, logicalWidth, logicalHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
```

Because every frame draws deterministically onto a `<canvas>`, adding **1-click study card export** (`canvas.toBlob()`) required fewer than twenty lines of code, letting students save high-resolution visual cheat sheets directly from any step.

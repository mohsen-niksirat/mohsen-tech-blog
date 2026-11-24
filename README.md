# Mohsen Niksirat — Personal Tech Blog & Systems Portfolio

Bilingual (**EN LTR / FA RTL**) engineering monograph, field notes, and shipped systems portfolio built with **Vite + Vanilla TypeScript + Three.js + GSAP ScrollTrigger + Lenis**.

> **Design Study Attribution:** Interaction design and editorial art direction inspired by `landonorris.com` / **OFF+BRAND** (Awwwards Site of the Year). Zero code, fonts, shaders, 3D models, or media were copied from the reference — every mechanic was re-implemented from scratch using Three.js, GSAP ScrollTrigger, and Lenis, and 100% of the content, essays, screenshots, and assets belong to Mohsen Niksirat.

## Stack
- **Build & Language:** Vite + Vanilla TypeScript (strict mode)
- **3D & Shaders:** Three.js (`ShaderMaterial` hero slice reveal + scroll-scrubbed 3D centerpiece)
- **Motion & Scroll:** GSAP + ScrollTrigger + Lenis smooth scroll
- **Typography (Self-hosted, `font-display: swap`):** Plus Jakarta Sans (EN), Vazirmatn (FA RTL), Newsreader (serif pull quotes), JetBrains Mono (mono captions)
- **Dates:** Gregorian (EN) and Jalali (`fa-IR-u-ca-persian`) on the FA edition

## Re-implemented Mechanics
1. **Cursor-Driven WebGL Slice Reveal (`src/webgl/HeroSliceReveal.ts`):** Custom GLSL fragment shader revealing a procedural `#d2ff00` wireframe/node lattice over the author's portrait in liquid horizontal slices. Lazy-loaded, paused off-screen via `IntersectionObserver`, and gracefully degraded to a static portrait on mobile (`< 1024px`) and `prefers-reduced-motion`.
2. **Scroll-Scrubbed 3D Centerpiece (`src/webgl/ScrollCenterpiece.ts`):** Lazy-loaded Three.js canvas pinned on desktop that rotates and transitions across 3 architectural states tied to featured essays: **AI Gateway Topology → FSRS Memory Curve → Godot 4 Horde Arena**.
3. **Photo-Journal Project Grid:** Asymmetric 12-column staggered gallery of 12 shipped projects with real screenshots and mono captions (`project · stack · year`).
4. **Bilingual EN/FA Choreography:** Full LTR/RTL support using logical CSS properties with clean ScrollTrigger teardown/re-initialization on language switch.

## Local Development
```bash
npm install
npm run dev
```

## Build & Local Preview
```bash
npm run build
npm run preview
```

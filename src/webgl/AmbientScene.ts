import * as THREE from "three";

export type AmbientRouteMode = "home" | "essay" | "other";

export interface AmbientSceneHandle {
  setScrollProgress: (p: number) => void;
  setRouteMode: (mode: AmbientRouteMode) => void;
  destroy: () => void;
}

export function mountAmbientScene(container: HTMLElement): AmbientSceneHandle | null {
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (isMobile) {
    console.info("[AmbientScene] skipped on mobile (<768px)");
    return null;
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    console.warn("[AmbientScene] WebGL unavailable:", err);
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 100);
  camera.position.set(0, 0.25, 6.2);

  const root = new THREE.Group();
  scene.add(root);

  // State 0: Hero AI-Gateway Node Point Cloud (cursor-reactive)
  const heroGeo = new THREE.BufferGeometry();
  const count = 260;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.6 + Math.random() * 1.4;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  heroGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const heroMat = new THREE.PointsMaterial({ color: 0xd2ff00, size: 0.055, transparent: true, opacity: 0.85 });
  const heroPoints = new THREE.Points(heroGeo, heroMat);
  root.add(heroPoints);

  // State 1: AI Gateway Topology
  const gwMat = new THREE.MeshBasicMaterial({ color: 0xd2ff00, wireframe: true, transparent: true, opacity: 0 });
  const gwRingMat = new THREE.MeshBasicMaterial({ color: 0xb4b8a5, wireframe: true, transparent: true, opacity: 0 });
  const gwGroup = new THREE.Group();
  const gwCore = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), gwMat);
  const gwRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.04, 12, 64), gwRingMat);
  gwRing.rotation.x = Math.PI * 0.35;
  gwGroup.add(gwCore, gwRing);
  root.add(gwGroup);

  // State 2: FSRS Memory Curve
  const fsrsMat = new THREE.MeshBasicMaterial({ color: 0xd2ff00, wireframe: true, transparent: true, opacity: 0 });
  const fsrsMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.26, 96, 12, 2, 3), fsrsMat);
  root.add(fsrsMesh);

  // State 3: Godot 4 Horde Arena
  const hordeMat = new THREE.MeshBasicMaterial({ color: 0xd2ff00, wireframe: true, transparent: true, opacity: 0 });
  const unitGeo = new THREE.OctahedronGeometry(0.18, 0);
  const hordeMesh = new THREE.InstancedMesh(unitGeo, hordeMat, 48);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 * 3;
    const radius = 0.85 + (i % 6) * 0.34;
    dummy.position.set(Math.cos(angle) * radius, ((i % 5) - 2) * 0.42, Math.sin(angle) * radius);
    dummy.rotation.set(i * 0.3, i * 0.5, 0);
    dummy.updateMatrix();
    hordeMesh.setMatrixAt(i, dummy.matrix);
  }
  root.add(hordeMesh);

  let scrollProgress = 0;
  let routeMode: AmbientRouteMode = "home";
  let targetMouseX = 0;
  let targetMouseY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let destroyed = false;
  let rafId = 0;

  const onMove = (e: PointerEvent) => {
    targetMouseX = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    targetMouseY = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  };
  const onResize = () => {
    if (destroyed) return;
    camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("resize", onResize);

  const renderFrame = (t: number, dt: number) => {
    mouseX += (targetMouseX - mouseX) * Math.min(1, dt * 4);
    mouseY += (targetMouseY - mouseY) * Math.min(1, dt * 4);

    // Smooth crossfade weights (lerp ~650ms)
    const isEssay = routeMode === "essay";
    const globalAlpha = isEssay ? 0.08 : routeMode === "other" ? 0.16 : 1.0;

    let wHero = 0;
    let wGw = 0;
    let wFsrs = 0;
    let wHorde = 0;

    if (routeMode === "home") {
      if (scrollProgress < 0.22) wHero = 0.82;
      else if (scrollProgress < 0.48) wGw = 0.28;
      else if (scrollProgress < 0.74) wFsrs = 0.26;
      else wHorde = 0.26;
    } else {
      wHero = 0.5;
    }

    const lerpRate = Math.min(1, dt * 2.4);
    heroMat.opacity += (wHero * globalAlpha - heroMat.opacity) * lerpRate;
    gwMat.opacity += (wGw * globalAlpha - gwMat.opacity) * lerpRate;
    gwRingMat.opacity += (wGw * 0.45 * globalAlpha - gwRingMat.opacity) * lerpRate;
    fsrsMat.opacity += (wFsrs * globalAlpha - fsrsMat.opacity) * lerpRate;
    hordeMat.opacity += (wHorde * globalAlpha - hordeMat.opacity) * lerpRate;

    heroPoints.visible = heroMat.opacity > 0.01;
    gwGroup.visible = gwMat.opacity > 0.01;
    fsrsMesh.visible = fsrsMat.opacity > 0.01;
    hordeMesh.visible = hordeMat.opacity > 0.01;

    root.rotation.y = t * 0.14 + scrollProgress * Math.PI * 1.8 + mouseX * 0.22;
    root.rotation.x = Math.sin(t * 0.3) * 0.1 + mouseY * 0.14;
    renderer.render(scene, camera);
  };

  if (prefersReduced) {
    renderFrame(0.5, 1);
  } else {
    const clock = new THREE.Clock();
    const tick = () => {
      if (destroyed) return;
      rafId = requestAnimationFrame(tick);
      if (document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      renderFrame(clock.getElapsedTime(), dt);
    };
    tick();
  }

  return {
    setScrollProgress(p: number) {
      scrollProgress = Math.max(0, Math.min(1, p));
      if (prefersReduced) renderFrame(0.5, 1);
    },
    setRouteMode(mode: AmbientRouteMode) {
      routeMode = mode;
      container.style.opacity = mode === "essay" ? "0.1" : "1";
      if (prefersReduced) renderFrame(0.5, 1);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      heroGeo.dispose();
      heroMat.dispose();
      gwMat.dispose();
      gwRingMat.dispose();
      fsrsMat.dispose();
      hordeMat.dispose();
      unitGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

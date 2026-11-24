import * as THREE from "three";

export interface CenterpieceHandle {
  setProgress: (p: number) => void;
  destroy: () => void;
}

export function mountScrollCenterpiece(container: HTMLElement): CenterpieceHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth || 400, container.clientHeight || 300);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, (container.clientWidth || 400) / Math.max(container.clientHeight || 300, 1), 0.1, 100);
  camera.position.set(0, 0.35, 5.2);

  const root = new THREE.Group();
  scene.add(root);

  const limeMat = new THREE.MeshBasicMaterial({ color: 0xd2ff00, wireframe: true, transparent: true, opacity: 0.9 });
  const subtleMat = new THREE.MeshBasicMaterial({ color: 0xb4b8a5, wireframe: true, transparent: true, opacity: 0.35 });

  // State 0: AI Gateway Topology (icosahedron hub + orbiting routing rings)
  const gatewayGroup = new THREE.Group();
  const coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), limeMat.clone());
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.04, 12, 64), subtleMat.clone());
  outerRing.rotation.x = Math.PI * 0.35;
  gatewayGroup.add(coreMesh, outerRing);
  root.add(gatewayGroup);

  // State 1: FSRS Stability Curve (3D parametric ribbon torus knot)
  const fsrsGroup = new THREE.Group();
  const fsrsMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(1.05, 0.24, 96, 12, 2, 3), limeMat.clone());
  fsrsGroup.add(fsrsMesh);
  fsrsGroup.visible = false;
  root.add(fsrsGroup);

  // State 2: Godot 4 Horde Arena (instanced wireframe swarm field)
  const hordeGroup = new THREE.Group();
  const unitGeo = new THREE.OctahedronGeometry(0.18, 0);
  const instanced = new THREE.InstancedMesh(unitGeo, limeMat.clone(), 48);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2 * 3;
    const radius = 0.65 + (i % 6) * 0.28;
    dummy.position.set(Math.cos(angle) * radius, ((i % 5) - 2) * 0.36, Math.sin(angle) * radius);
    dummy.rotation.set(i * 0.3, i * 0.5, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  hordeGroup.add(instanced);
  hordeGroup.visible = false;
  root.add(hordeGroup);

  let progress = 0;
  let visible = true;
  let destroyed = false;
  let rafId = 0;

  const onResize = () => {
    if (destroyed) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", onResize);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    },
    { threshold: 0.05 }
  );
  io.observe(container);

  const clock = new THREE.Clock();
  const tick = () => {
    if (destroyed) return;
    rafId = requestAnimationFrame(tick);
    if (!visible) return;
    const t = clock.getElapsedTime();

    root.rotation.y = t * 0.28 + progress * Math.PI * 2.5;
    root.rotation.x = Math.sin(t * 0.5) * 0.16 + progress * 0.6;

    const stateIdx = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
    gatewayGroup.visible = stateIdx === 0;
    fsrsGroup.visible = stateIdx === 1;
    hordeGroup.visible = stateIdx === 2;

    renderer.render(scene, camera);
  };
  tick();

  return {
    setProgress(p: number) {
      progress = Math.max(0, Math.min(1, p));
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("resize", onResize);
      unitGeo.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

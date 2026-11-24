import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uImageRes;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv, vec2 res, vec2 imgRes) {
    float sAspect = res.x / max(res.y, 1.0);
    float iAspect = imgRes.x / max(imgRes.y, 1.0);
    vec2 scale = sAspect > iAspect ? vec2(1.0, iAspect / sAspect) : vec2(sAspect / iAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = coverUv(vUv, uResolution, uImageRes);
    vec4 photo = texture2D(uTexture, uv);

    // Liquid horizontal slice reveal mask following cursor Y & X
    float sliceCount = 22.0;
    float sliceId = floor(vUv.y * sliceCount);
    float wave = sin(vUv.y * 28.0 + uTime * 2.4 + sliceId * 0.7) * 0.045;
    float distY = abs(vUv.y - uMouse.y + wave);
    float distX = abs(vUv.x - uMouse.x);
    float band = smoothstep(0.26, 0.03, distY) * smoothstep(0.55, 0.08, distX) * uHover;

    // Procedural wireframe + AI-gateway node lattice second layer
    vec2 gridUv = fract(vUv * vec2(14.0, 18.0));
    float wire = step(0.92, gridUv.x) + step(0.92, gridUv.y);
    float node = smoothstep(0.18, 0.05, length(gridUv - 0.5));
    float luma = dot(photo.rgb, vec3(0.299, 0.587, 0.114));
    vec3 darkBase = vec3(0.067, 0.067, 0.071);
    vec3 lime = vec3(0.824, 1.0, 0.0); // #d2ff00

    vec3 lattice = mix(darkBase, lime, clamp(wire * 0.35 + node * (0.4 + luma * 0.8), 0.0, 1.0));
    // Subtle horizontal slice chromatic offset
    vec4 shiftedPhoto = texture2D(uTexture, uv + vec2(band * 0.025 * sin(sliceId), 0.0));
    vec3 finalColor = mix(shiftedPhoto.rgb, lattice, band * 0.88);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export interface HeroRevealHandle {
  destroy: () => void;
}

export function mountHeroSliceReveal(container: HTMLElement, imageUrl: string): HeroRevealHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTexture: { value: null as THREE.Texture | null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
    uImageRes: { value: new THREE.Vector2(800, 800) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const loader = new THREE.TextureLoader();
  loader.load(imageUrl, (tex) => {
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    uniforms.uTexture.value = tex;
    const img = tex.image as HTMLImageElement | undefined;
    if (img && img.width && img.height) {
      uniforms.uImageRes.value.set(img.width, img.height);
    }
  });

  const targetMouse = new THREE.Vector2(0.5, 0.5);
  let targetHover = 0;
  let visible = true;
  let rafId = 0;
  let destroyed = false;

  const onMove = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    targetMouse.x = (e.clientX - rect.left) / Math.max(rect.width, 1);
    targetMouse.y = 1.0 - (e.clientY - rect.top) / Math.max(rect.height, 1);
    targetHover = 1;
  };
  const onLeave = () => {
    targetHover = 0;
  };
  const onResize = () => {
    if (destroyed) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h);
    uniforms.uResolution.value.set(w, h);
  };

  container.addEventListener("pointermove", onMove);
  container.addEventListener("pointerleave", onLeave);
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
    if (!visible || !uniforms.uTexture.value) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.lerp(targetMouse, 0.14);
    uniforms.uHover.value += (targetHover - uniforms.uHover.value) * 0.12;
    renderer.render(scene, camera);
  };
  tick();

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      io.disconnect();
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      uniforms.uTexture.value?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

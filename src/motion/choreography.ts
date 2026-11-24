import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CenterpieceHandle } from "../webgl/ScrollCenterpiece";

gsap.registerPlugin(ScrollTrigger);

export interface MotionHandle {
  destroy: () => void;
}

export function initPageMotion(centerpiece: CenterpieceHandle | null): MotionHandle {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  let lenis: Lenis | null = null;
  let tickerFn: ((time: number) => void) | null = null;

  if (!prefersReduced) {
    lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    tickerFn = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);
  }

  const ctx = gsap.context(() => {
    // Pinned scroll-scrubbed 3D centerpiece chapter on desktop
    const section = document.querySelector<HTMLElement>("[data-centerpiece-section]");
    const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-centerpiece-step]"));
    const badge = document.querySelector<HTMLElement>("[data-centerpiece-badge]");

    if (section && centerpiece && !prefersReduced) {
      const labels = [
        badge?.dataset.label0 || "01 · AI GATEWAY TOPOLOGY",
        badge?.dataset.label1 || "02 · FSRS MEMORY CURVE",
        badge?.dataset.label2 || "03 · GODOT 4 HORDE ARENA",
      ];

      ScrollTrigger.create({
        trigger: section,
        start: isDesktop ? "top 88px" : "top 75%",
        end: isDesktop ? "+=1100" : "bottom 35%",
        pin: isDesktop,
        scrub: 0.8,
        onUpdate(self) {
          centerpiece.setProgress(self.progress);
          const idx = self.progress < 0.34 ? 0 : self.progress < 0.67 ? 1 : 2;
          steps.forEach((el, i) => el.classList.toggle("is-active", i === idx));
          if (badge) badge.textContent = labels[idx];
        },
      });
    }

    // Subtle photo-journal parallax on desktop
    if (isDesktop && !prefersReduced) {
      gsap.utils.toArray<HTMLElement>(".journal-card").forEach((card, idx) => {
        gsap.fromTo(
          card,
          { y: idx % 2 === 0 ? 18 : 34 },
          {
            y: idx % 2 === 0 ? -12 : -22,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }
  });

  return {
    destroy() {
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
    },
  };
}

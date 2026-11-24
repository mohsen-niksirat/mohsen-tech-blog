import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AmbientSceneHandle } from "../webgl/AmbientScene";

gsap.registerPlugin(ScrollTrigger);

export interface MotionHandle {
  destroy: () => void;
}

export function initPageMotion(ambient: AmbientSceneHandle | null): MotionHandle {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let lenis: Lenis | null = null;
  let tickerFn: ((time: number) => void) | null = null;
  const cleanups: Array<() => void> = [];

  if (!prefersReduced) {
    lenis = new Lenis({
      duration: 0.95,
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

  // Feed 1:1 scroll progress to Ambient 3D background (ZERO pinning!)
  const onScroll = () => {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const p = Math.min(1, Math.max(0, window.scrollY / max));
    ambient?.setScrollProgress(p);

    const steps = document.querySelectorAll<HTMLElement>("[data-centerpiece-step]");
    const badge = document.querySelector<HTMLElement>("[data-centerpiece-badge]");
    if (steps.length) {
      const idx = p < 0.35 ? 0 : p < 0.65 ? 1 : 2;
      steps.forEach((el, i) => el.classList.toggle("is-active", i === idx));
      if (badge) {
        const labels = [badge.dataset.label0, badge.dataset.label1, badge.dataset.label2];
        if (labels[idx]) badge.textContent = labels[idx]!;
      }
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  cleanups.push(() => window.removeEventListener("scroll", onScroll));

  const ctx = gsap.context(() => {
    if (prefersReduced) return;

    // Kinetic Hero masked line reveal
    const heroLines = gsap.utils.toArray<HTMLElement>("[data-hero-reveal]");
    if (heroLines.length) {
      gsap.from(heroLines, {
        yPercent: 28,
        opacity: 0,
        duration: 0.72,
        stagger: 0.08,
        ease: "power3.out",
        clearProps: "transform,opacity",
      });
    }

    // Statement line-by-line scroll reveal
    const stmtLines = gsap.utils.toArray<HTMLElement>("[data-statement-line]");
    if (stmtLines.length) {
      gsap.from(stmtLines, {
        y: 26,
        opacity: 0.15,
        stagger: 0.12,
        duration: 0.65,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "[data-statement-section]",
          start: "top 78%",
          once: true,
        },
      });
    }

    // Giant outline words parallax drift (no pin)
    if (isDesktop) {
      gsap.utils.toArray<HTMLElement>("[data-outline-drift]").forEach((el, idx) => {
        gsap.fromTo(
          el,
          { xPercent: idx % 2 === 0 ? -4 : 4 },
          {
            xPercent: idx % 2 === 0 ? 6 : -6,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement || el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }

    // Image clip-path reveal on scroll into view
    gsap.utils.toArray<HTMLElement>(".journal-card__media").forEach((media) => {
      gsap.fromTo(
        media,
        { clipPath: "inset(10% 0% 0% 0% round 16px)", opacity: 0.6 },
        {
          clipPath: "inset(0% 0% 0% 0% round 16px)",
          opacity: 1,
          duration: 0.65,
          ease: "power2.out",
          scrollTrigger: {
            trigger: media,
            start: "top 86%",
            once: true,
          },
        }
      );
    });
  });

  // Card radial spotlight + Custom cursor + Magnetic buttons (desktop fine pointer only)
  if (finePointer && !prefersReduced) {
    const cards = document.querySelectorAll<HTMLElement>(".journal-card, .essay-card, .note-card, .centerpiece-step");
    cards.forEach((card) => {
      const onCardMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      };
      card.addEventListener("pointermove", onCardMove, { passive: true });
      cleanups.push(() => card.removeEventListener("pointermove", onCardMove));
    });

    // Magnetic primary buttons
    document.querySelectorAll<HTMLElement>(".pill-btn--accent").forEach((btn) => {
      const onBtnMove = (e: PointerEvent) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.18;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.22;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      };
      const onBtnLeave = () => {
        btn.style.transform = "";
      };
      btn.addEventListener("pointermove", onBtnMove, { passive: true });
      btn.addEventListener("pointerleave", onBtnLeave);
      cleanups.push(() => {
        btn.removeEventListener("pointermove", onBtnMove);
        btn.removeEventListener("pointerleave", onBtnLeave);
      });
    });
  }

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
      ctx.revert();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      if (tickerFn) gsap.ticker.remove(tickerFn);
      lenis?.destroy();
    },
  };
}

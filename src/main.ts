import "./styles/main.css";
import contentData from "./data/content.json";
import { initPageMotion, type MotionHandle } from "./motion/choreography";
import type { HeroRevealHandle } from "./webgl/HeroSliceReveal";
import type { AmbientSceneHandle } from "./webgl/AmbientScene";

type Locale = "en" | "fa";

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface Post {
  slug: string;
  locale: Locale;
  title: string;
  subtitle: string;
  date: string;
  dateFormatted: string;
  tags: string[];
  readingMinutes: number;
  readingLabel: string;
  cover: string;
  coverAlt: string;
  sceneState: number;
  pullQuote: string;
  headings: Heading[];
  html: string;
  plainText: string;
}

interface Note {
  id: string;
  date: string;
  dateEn: string;
  dateFa: string;
  tag: string;
  tagFa: string;
  title: string;
  titleFa: string;
  body: string;
  bodyFa: string;
  link: string;
  linkLabel: string;
}

interface Project {
  id: string;
  name: string;
  stack: string;
  year: string;
  shot: string;
  essaySlug: string;
  desc: string;
  descFa: string;
  live: string;
  repo: string;
}

const DATA = contentData as unknown as {
  posts: Record<Locale, Post[]>;
  notes: Note[];
  projects: Project[];
};

const BASE = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
const asset = (rel: string) => `${BASE}${rel.replace(/^\/+/, "")}`;
const routeUrl = (sub: string) => `${BASE}${sub.replace(/^\/+/, "")}`;

const app = document.getElementById("app")!;
let activeHero: HeroRevealHandle | null = null;
let ambientScene: AmbientSceneHandle | null = null;
let activeMotion: MotionHandle | null = null;
let scrollCleanup: (() => void) | null = null;

// Persistent layers (fixed ambient 3D background + route curtain + custom cursor)
const ambientHost = document.createElement("div");
ambientHost.className = "ambient-canvas-layer";
ambientHost.setAttribute("aria-hidden", "true");
document.body.prepend(ambientHost);

const curtain = document.createElement("div");
curtain.className = "route-curtain";
curtain.setAttribute("aria-hidden", "true");
document.body.appendChild(curtain);

function initCustomCursor() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduced) return;
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.append(dot, ring);

  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  let shown = false;

  window.addEventListener(
    "pointermove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const hoverEl = (e.target as HTMLElement | null)?.closest("a, button, .journal-card, .essay-card");
      ring.classList.toggle("is-hover", Boolean(hoverEl));
    },
    { passive: true }
  );

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

let loaderAlreadyRan = false;

function runBrandedLoader() {
  if (loaderAlreadyRan) return;
  loaderAlreadyRan = true;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try {
    seen = sessionStorage.getItem("mn_loaded") === "1";
    if (!seen) sessionStorage.setItem("mn_loaded", "1");
  } catch {
    seen = false;
  }
  if (reduced || seen) return;

  const loader = document.createElement("div");
  loader.className = "brand-loader";
  loader.innerHTML = `
    <div class="brand-loader__mono">MN</div>
    <div class="brand-loader__counter" data-loader-num>00</div>
    <button type="button" class="brand-loader__skip" data-loader-skip>SKIP</button>
  `;
  document.body.appendChild(loader);

  const numEl = loader.querySelector<HTMLElement>("[data-loader-num]");
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    loader.classList.add("is-done");
    setTimeout(() => loader.remove(), 460);
  };

  loader.querySelector("[data-loader-skip]")?.addEventListener("click", finish);
  loader.addEventListener("click", finish);
  const start = performance.now();
  const duration = 820;
  const step = (now: number) => {
    if (finished) return;
    const p = Math.min(1, (now - start) / duration);
    if (numEl) numEl.textContent = String(Math.round(p * 100)).padStart(2, "0");
    if (p < 1) requestAnimationFrame(step);
    else finish();
  };
  requestAnimationFrame(step);
  setTimeout(finish, 1150);
}

void import("./webgl/AmbientScene").then(({ mountAmbientScene }) => {
  ambientScene = mountAmbientScene(ambientHost);
  const { route } = parseRoute(window.location.pathname);
  ambientScene?.setRouteMode(route === "home" ? "home" : route === "essay" ? "essay" : "other");
});
initCustomCursor();
runBrandedLoader();

function cleanupActive() {
  activeHero?.destroy();
  activeHero = null;
  activeMotion?.destroy();
  activeMotion = null;
  scrollCleanup?.();
  scrollCleanup = null;
}

function stripBase(pathname: string): string {
  if (pathname.startsWith(BASE)) {
    const rest = pathname.slice(BASE.length);
    return `/${rest}`.replace(/\/+$/, "") || "/";
  }
  return pathname.replace(/\/+$/, "") || "/";
}

function parseRoute(pathname: string): { locale: Locale; route: string; slug?: string } {
  const clean = stripBase(pathname);
  const isFa = clean === "/fa" || clean.startsWith("/fa/");
  const locale: Locale = isFa ? "fa" : "en";
  const sub = isFa ? clean.replace(/^\/fa/, "") || "/" : clean;

  if (sub === "/") return { locale, route: "home" };
  if (sub === "/essays") return { locale, route: "essays" };
  if (sub.startsWith("/essays/")) return { locale, route: "essay", slug: sub.slice("/essays/".length) };
  if (sub === "/projects") return { locale, route: "projects" };
  if (sub === "/notes") return { locale, route: "notes" };
  if (sub === "/about") return { locale, route: "about" };
  if (sub === "/archive") return { locale, route: "archive" };
  if (sub === "/search") return { locale, route: "search" };
  return { locale, route: "home" };
}

function prefixFor(locale: Locale): string {
  return locale === "fa" ? `${BASE}fa` : BASE.replace(/\/$/, "");
}

function switchLocalePath(pathname: string, target: Locale): string {
  const { route, slug } = parseRoute(pathname);
  const p = prefixFor(target);
  if (route === "home") return target === "fa" ? `${BASE}fa/` : BASE;
  if (route === "essay" && slug) return `${p}/essays/${slug}`;
  return `${p}/${route}`;
}

function navLinks(locale: Locale, activeRoute: string): string {
  const p = prefixFor(locale);
  const items =
    locale === "fa"
      ? [
          { key: "home", label: "خانه", href: `${BASE}fa/` },
          { key: "essays", label: "مقالات", href: `${p}/essays` },
          { key: "projects", label: "پروژه‌ها", href: `${p}/projects` },
          { key: "notes", label: "یادداشت‌ها", href: `${p}/notes` },
          { key: "archive", label: "آرشیو", href: `${p}/archive` },
          { key: "about", label: "درباره من", href: `${p}/about` },
        ]
      : [
          { key: "home", label: "Home", href: BASE },
          { key: "essays", label: "Essays", href: routeUrl("essays") },
          { key: "projects", label: "Projects", href: routeUrl("projects") },
          { key: "notes", label: "Field Notes", href: routeUrl("notes") },
          { key: "archive", label: "Archive", href: routeUrl("archive") },
          { key: "about", label: "About", href: routeUrl("about") },
        ];

  return items
    .map(
      (item) =>
        `<a href="${item.href}" data-link class="${activeRoute === item.key || (activeRoute === "essay" && item.key === "essays") ? "is-active" : ""}">${item.label}</a>`
    )
    .join("");
}

function renderShell(locale: Locale, route: string, mainHtml: string, showProgress = false): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  const altLocale: Locale = fa ? "en" : "fa";
  const altHref = switchLocalePath(window.location.pathname, altLocale);

  return `
    ${showProgress ? `<div class="reading-progress" aria-hidden="true"><div class="reading-progress__fill" data-reading-fill></div></div>` : ""}
    <header class="site-header">
      <a href="${fa ? `${BASE}fa/` : BASE}" data-link class="brand-mark" style="white-space:nowrap;flex-shrink:0">
        <span class="brand-dot" aria-hidden="true"></span>
        <span>${fa ? "محسن نیک‌سیرت" : "MOHSEN NIKSIRAT"}</span>
      </a>
      <nav class="site-nav" aria-label="${fa ? "منوی اصلی" : "Primary navigation"}">
        ${navLinks(locale, route)}
      </nav>
      <div class="header-actions">
        <a href="${p}/search" data-link class="pill-btn" aria-label="${fa ? "جستجو" : "Search"}">${fa ? "جستجو" : "SEARCH"}</a>
        <a href="${altHref}" data-link class="pill-btn pill-btn--accent" data-lang-switch>${fa ? "EN" : "فارسی"}</a>
        <button type="button" class="mobile-menu-btn" data-menu-toggle aria-expanded="false">${fa ? "منو" : "MENU"}</button>
      </div>
    </header>
    <div class="mobile-drawer" data-mobile-drawer>
      ${navLinks(locale, route)}
      <a href="${p}/search" data-link>${fa ? "جستجو" : "Search"}</a>
    </div>
    <main class="page-shell">${mainHtml}</main>
    <div class="lightbox" data-lightbox role="dialog" aria-modal="true" aria-label="${fa ? "بزرگ‌نمایی تصویر پروژه" : "Project screenshot lightbox"}">
      <div class="lightbox__dialog">
        <img class="lightbox__img" data-lightbox-img src="" alt="" />
        <div class="lightbox__bar">
          <span data-lightbox-caption></span>
          <button type="button" class="pill-btn pill-btn--accent" data-lightbox-close>${fa ? "بستن (ESC)" : "CLOSE (ESC)"}</button>
        </div>
      </div>
    </div>
    ${route === "home" ? `<div class="filmic-overlay" aria-hidden="true"></div><div class="filmic-vignette" aria-hidden="true"></div>` : ""}
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div>
          <strong>${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}</strong> ·
          ${fa ? "کارشناسی ارشد معماری سیستم‌های کامپیوتری · تبریز" : "M.Sc. Computer Architecture · Tabriz"}
        </div>
        <div class="journal-card__links">
          <a href="https://github.com/mohsen-niksirat" target="_blank" rel="noopener noreferrer" class="pill-btn">GitHub</a>
          <a href="${asset(fa ? "assets/files/mohsen-niksirat-resume-fa.pdf" : "assets/files/mohsen-niksirat-resume.pdf")}" target="_blank" rel="noopener noreferrer" class="pill-btn">${fa ? "رزومه PDF" : "Resume PDF"}</a>
        </div>
      </div>
      <div class="footer-wordmark" aria-hidden="true">${fa ? "محسن نیک‌سیرت" : "MOHSEN NIKSIRAT"}</div>
    </footer>
  `;
}

function renderHome(locale: Locale): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  const posts = DATA.posts[locale];
  const featured = posts.slice(0, 3);
  const projects = DATA.projects.slice(0, 6);
  const notes = DATA.notes.slice(0, 3);

  return `
    <section class="container hero">
      <div>
        <span class="eyebrow">${fa ? "مهندسی سیستم‌ها · متن‌باز · تبریز" : "SYSTEMS ENGINEERING · OPEN SOURCE · TABRIZ"}</span>
        <h1 class="hero__title">
          ${
            fa
              ? `معماری <span class="accent-word">درگاه‌های AI</span>، ابزارهای مرورگر و سیستم‌های واقعی.`
              : `Building <span class="accent-word">AI Gateways</span>, Offline Tools & Real Systems.`
          }
        </h1>
        <p class="hero__lead">
          ${
            fa
              ? "محسن نیک‌سیرت — کارشناسی ارشد معماری سیستم‌های کامپیوتری. ۶ مقاله مهندسی عمیق، ۱۲ پروژه متن‌باز منتشرشده و یادداشت‌های فنی."
              : "Mohsen Niksirat — M.Sc. Computer Architecture. 6 engineering essays, 12 shipped open-source systems, and field notes on AI gateways, FSRS, WebAssembly, and local-first software."
          }
        </p>
        <blockquote class="hero__quote">
          ${
            fa
              ? "«معماری خوب وقتی دیده می‌شود که در فشار واقعی، بدون وابستگی اضافی و با تاخیر نزدیک به صفر کار کند.»"
              : "“Good systems architecture shows up under real load — zero unnecessary hops, deterministic state, and 60fps feedback.”"
          }
        </blockquote>
        <div class="hero__cta-row">
          <a href="${p}/essays" data-link class="pill-btn pill-btn--accent">${fa ? "مطالعه مقالات" : "READ ESSAYS (6)"}</a>
          <a href="${p}/projects" data-link class="pill-btn">${fa ? "گالری پروژه‌ها (۱۲)" : "SYSTEMS GALLERY (12)"}</a>
          <a href="${p}/about" data-link class="pill-btn">${fa ? "درباره من و رزومه" : "ABOUT & RESUME"}</a>
        </div>
      </div>
      <div class="hero__visual" data-hero-visual>
        <img src="${asset("assets/shots/avatar.webp")}" alt="${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat portrait"}" class="hero__fallback-img" width="520" height="650" />
        <div class="hero__canvas-host" data-hero-canvas aria-hidden="true"></div>
        <div class="hero__hud">
          <span>${fa ? "لایه WebGL تعاملی" : "WEBGL SLICE REVEAL"}</span>
          <span>${fa ? "موس را حرکت دهید" : "MOVE CURSOR"}</span>
        </div>
      </div>
    </section>

    <section class="topic-ticker" aria-label="${fa ? "حوزه‌های تخصصی" : "Engineering topics"}">
      <div class="topic-ticker__track">
        <span><strong>FSRS</strong> · AI GATEWAYS · <strong>WEBASSEMBLY</strong> · LOCAL-FIRST · <strong>GODOT 4</strong> · MCP STUDIO · <strong>TYPESCRIPT</strong> · RUST TAURI ·</span>
        <span><strong>FSRS</strong> · AI GATEWAYS · <strong>WEBASSEMBLY</strong> · LOCAL-FIRST · <strong>GODOT 4</strong> · MCP STUDIO · <strong>TYPESCRIPT</strong> · RUST TAURI ·</span>
      </div>
    </section>

    <section class="statement-section" data-statement-section>
      <div class="outline-bg-word" data-outline-drift aria-hidden="true">ESSAYS</div>
      <div class="container">
        <span class="eyebrow">${fa ? "بیانیه مهندسی" : "ENGINEERING STATEMENT"}</span>
        <p class="statement-text">
          ${
            fa
              ? `<span data-statement-line>ساخت نرم‌افزارهایی که <span class="accent-word">سریع، آفلاین و قابل‌اعتماد</span> هستند —</span><span data-statement-line>از درگاه‌های هوش مصنوعی تا بازی‌های WebAssembly.</span>`
              : `<span data-statement-line>Software that runs <span class="accent-word">fast, local-first, and deterministic</span> —</span><span data-statement-line>from multi-provider AI gateways to 60fps WebAssembly engines.</span>`
          }
        </p>
        <a href="${p}/about" data-link class="pill-btn">${fa ? "بیشتر درباره من" : "ABOUT & RESUME →"}</a>
      </div>
    </section>

    <section class="centerpiece-section" data-centerpiece-section>
      <div class="container" style="position:relative">
        <div class="outline-bg-word" data-outline-drift aria-hidden="true">SYSTEMS</div>
        <div class="section-head">
          <div>
            <span class="eyebrow">${fa ? "معماری زنده در پس‌زمینه (شبیه‌سازی‌شده)" : "AMBIENT 3D ARCHITECTURE (SIMULATED)"}</span>
            <h2>${fa ? "مقالات شاخص مهندسی" : "Featured Engineering Essays"}</h2>
          </div>
          <a href="${p}/essays" data-link class="pill-btn">${fa ? "همه ۶ مقاله" : "ALL 6 ESSAYS"}</a>
        </div>
        <div class="centerpiece-steps">
          <div class="centerpiece-badge"
               style="position:static;display:inline-flex;align-self:flex-start;margin-bottom:0.5rem"
               data-centerpiece-badge
               data-label0="${fa ? "شبیه‌سازی‌شده · ۰۱ · توپولوژی درگاه AI" : "SIMULATED · 01 · AI GATEWAY TOPOLOGY"}"
               data-label1="${fa ? "شبیه‌سازی‌شده · ۰۲ · منحنی حافظه FSRS" : "SIMULATED · 02 · FSRS MEMORY CURVE"}"
               data-label2="${fa ? "شبیه‌سازی‌شده · ۰۳ · آرنا سه‌بعدی Godot 4" : "SIMULATED · 03 · GODOT 4 HORDE ARENA"}">
            ${fa ? "شبیه‌سازی‌شده · ۰۱ · توپولوژی درگاه AI" : "SIMULATED · 01 · AI GATEWAY TOPOLOGY"}
          </div>
          ${featured
            .map(
              (post, idx) => `
            <article class="centerpiece-step ${idx === 0 ? "is-active" : ""}" data-centerpiece-step>
              <div class="essay-card__meta">
                <span>0${idx + 1} · ${post.dateFormatted}</span>
                <span>${post.readingLabel}</span>
              </div>
              <h3>${post.title}</h3>
              <p>${post.subtitle}</p>
              <a href="${p}/essays/${post.slug}" data-link class="pill-btn">${fa ? "خواندن مقاله" : "READ ESSAY"}</a>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${fa ? "گالری پروژه‌های منتشرشده" : "PHOTO-JOURNAL SYSTEMS INDEX"}</span>
            <h2>${fa ? "سیستم‌های ساخته‌شده" : "Shipped Systems"}</h2>
          </div>
          <a href="${p}/projects" data-link class="pill-btn">${fa ? "مشاهده هر ۱۲ پروژه" : "VIEW ALL 12 PROJECTS"}</a>
        </div>
        <div class="journal-grid">
          ${projects
            .map(
              (proj) => `
            <article class="journal-card">
              <div class="journal-card__media" data-lightbox-src="${asset(proj.shot)}" data-lightbox-title="${proj.name} · ${proj.stack} · ${proj.year}">
                <img src="${asset(proj.shot)}" alt="${proj.name}" loading="lazy" decoding="async" />
              </div>
              <div class="journal-card__caption">
                <strong>${proj.name}</strong>
                <span>${proj.stack} · ${proj.year}</span>
              </div>
              <p class="journal-card__desc">${fa ? proj.descFa : proj.desc}</p>
              <div class="journal-card__links">
                ${proj.live ? `<a href="${proj.live}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--accent">${fa ? "نسخه زنده" : "LIVE"}</a>` : ""}
                <a href="${proj.repo}" target="_blank" rel="noopener noreferrer" class="pill-btn">GitHub</a>
                ${proj.essaySlug ? `<a href="${p}/essays/${proj.essaySlug}" data-link class="pill-btn">${fa ? "مقاله معماری" : "ESSAY"}</a>` : ""}
              </div>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section-block">
      <div class="container">
        <div class="section-head">
          <div>
            <span class="eyebrow">${fa ? "یادداشت‌های کوتاه فنی" : "ENGINEERING FIELD NOTES"}</span>
            <h2>${fa ? "آخرین یادداشت‌ها" : "Latest Field Notes"}</h2>
          </div>
          <a href="${p}/notes" data-link class="pill-btn">${fa ? "همه یادداشت‌ها" : "ALL NOTES"}</a>
        </div>
        <div class="notes-grid">
          ${notes
            .map(
              (n) => `
            <article class="note-card">
              <div class="essay-card__meta">
                <span>${fa ? n.tagFa : n.tag}</span>
                <span>${fa ? n.dateFa : n.dateEn}</span>
              </div>
              <h3 style="margin:0;font-size:1.15rem">${fa ? n.titleFa : n.title}</h3>
              <p style="margin:0;color:var(--ink-muted);font-size:0.92rem">${fa ? n.bodyFa : n.body}</p>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}

function renderEssays(locale: Locale): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  const posts = DATA.posts[locale];
  return `
    <section class="container section-block" style="border-top:0">
      <div class="section-head">
        <div>
          <span class="eyebrow">${fa ? "مقالات مهندسی" : "LONG-FORM MONOGRAPHS"}</span>
          <h1>${fa ? "مقالات تخصصی" : "Engineering Essays"}</h1>
        </div>
      </div>
      <div class="essay-grid">
        ${posts
          .map(
            (post) => `
          <a href="${p}/essays/${post.slug}" data-link class="essay-card">
            <img src="${asset(post.cover)}" alt="${post.coverAlt}" class="essay-card__cover" loading="lazy" />
            <div class="essay-card__body">
              <div class="essay-card__meta">
                <span>${post.dateFormatted}</span>
                <span>${post.readingLabel}</span>
              </div>
              <h2 class="essay-card__title">${post.title}</h2>
              <p class="essay-card__excerpt">${post.subtitle}</p>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderEssayDetail(locale: Locale, slug: string): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  const post = DATA.posts[locale].find((x) => x.slug === slug) || DATA.posts[locale][0];
  return `
    <div class="container article-layout">
      <article>
        <div class="article-header">
          <a href="${p}/essays" data-link class="pill-btn">${fa ? "بازگشت به مقالات" : "← ALL ESSAYS"}</a>
          <h1>${post.title}</h1>
          <div class="essay-card__meta" style="justify-content:flex-start;gap:1.5rem">
            <span>${post.dateFormatted}</span>
            <span>${post.readingLabel}</span>
            <span>${post.tags.join(" · ")}</span>
          </div>
          <img src="${asset(post.cover)}" alt="${post.coverAlt}" class="article-cover" />
        </div>
        <div class="prose">${post.html}</div>
      </article>
      <aside class="sticky-toc" aria-label="${fa ? "فهرست مطالب" : "Table of contents"}">
        <p class="sticky-toc__title">${fa ? "فهرست مطالب" : "ON THIS PAGE"}</p>
        <ul>
          ${post.headings.map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`).join("")}
        </ul>
      </aside>
    </div>
  `;
}

function renderProjects(locale: Locale): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  return `
    <section class="container section-block" style="border-top:0">
      <div class="section-head">
        <div>
          <span class="eyebrow">${fa ? "۱۲ پروژه متن‌باز" : "12 SHIPPED OPEN-SOURCE SYSTEMS"}</span>
          <h1>${fa ? "گالری پروژه‌ها" : "Projects Gallery"}</h1>
        </div>
      </div>
      <div class="journal-grid">
        ${DATA.projects
          .map(
            (proj) => `
          <article class="journal-card">
            <div class="journal-card__media" data-lightbox-src="${asset(proj.shot)}" data-lightbox-title="${proj.name} · ${proj.stack} · ${proj.year}">
              <img src="${asset(proj.shot)}" alt="${proj.name}" loading="lazy" />
            </div>
            <div class="journal-card__caption">
              <strong>${proj.name}</strong>
              <span>${proj.stack} · ${proj.year}</span>
            </div>
            <p class="journal-card__desc">${fa ? proj.descFa : proj.desc}</p>
            <div class="journal-card__links">
              ${proj.live ? `<a href="${proj.live}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--accent">${fa ? "نسخه زنده" : "LIVE"}</a>` : ""}
              <a href="${proj.repo}" target="_blank" rel="noopener noreferrer" class="pill-btn">GitHub</a>
              ${proj.essaySlug ? `<a href="${p}/essays/${proj.essaySlug}" data-link class="pill-btn">${fa ? "مقاله معماری" : "ESSAY"}</a>` : ""}
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderNotes(locale: Locale): string {
  const fa = locale === "fa";
  return `
    <section class="container section-block" style="border-top:0">
      <div class="section-head">
        <div>
          <span class="eyebrow">${fa ? "یادداشت‌های میدانی" : "FIELD NOTES"}</span>
          <h1>${fa ? "یادداشت‌های فنی" : "Engineering Field Notes"}</h1>
        </div>
      </div>
      <div class="notes-grid">
        ${DATA.notes
          .map(
            (n) => `
          <article class="note-card">
            <div class="essay-card__meta">
              <span>${fa ? n.tagFa : n.tag}</span>
              <span>${fa ? n.dateFa : n.dateEn}</span>
            </div>
            <h2 style="margin:0;font-size:1.25rem">${fa ? n.titleFa : n.title}</h2>
            <p style="margin:0;color:var(--ink-secondary);font-size:0.95rem">${fa ? n.bodyFa : n.body}</p>
            <div style="margin-top:auto;padding-top:0.5rem">
              <a href="${n.link}" target="_blank" rel="noopener noreferrer" class="pill-btn">${n.linkLabel}</a>
            </div>
          </article>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAbout(locale: Locale): string {
  const fa = locale === "fa";
  return `
    <section class="container section-block" style="border-top:0">
      <div class="about-grid">
        <img src="${asset("assets/shots/avatar.webp")}" alt="${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}" class="about-portrait" />
        <div class="prose">
          <span class="eyebrow">${fa ? "درباره نویسنده" : "ABOUT THE AUTHOR"}</span>
          <h1 style="margin:0.5rem 0 1rem;font-size:var(--text-h1)">${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}</h1>
          <p>
            ${
              fa
                ? "کارشناسی ارشد معماری سیستم‌های کامپیوتری از تبریز. سازنده نرم‌افزارهای متن‌باز با تمرکز بر درگاه‌های چندسرویس‌دهنده هوش مصنوعی، مینی‌اپ‌های تلگرام، ابزارهای یادگیری مبتنی بر الگوریتم FSRS و ابزارهای توسعه‌دهنده کاملاً محلی در مرورگر."
                : "M.Sc. in Computer Architecture based in Tabriz. Open-source builder focused on multi-provider AI gateways, Telegram Mini Apps, FSRS spaced-repetition tools, WebAssembly games, and privacy-first browser developer tools."
            }
          </p>
          <div class="hero__cta-row" style="margin-top:1.75rem">
            <a href="${asset("assets/files/mohsen-niksirat-resume.pdf")}" target="_blank" rel="noopener noreferrer" class="pill-btn pill-btn--accent">${fa ? "دانلود رزومه انگلیسی (PDF)" : "Download Resume (EN PDF)"}</a>
            <a href="${asset("assets/files/mohsen-niksirat-resume-fa.pdf")}" target="_blank" rel="noopener noreferrer" class="pill-btn">${fa ? "دانلود رزومه فارسی (PDF)" : "Download Resume (FA PDF)"}</a>
            <a href="https://github.com/mohsen-niksirat" target="_blank" rel="noopener noreferrer" class="pill-btn">GitHub</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderArchive(locale: Locale): string {
  const fa = locale === "fa";
  const p = prefixFor(locale);
  const posts = DATA.posts[locale];
  return `
    <section class="container section-block" style="border-top:0">
      <div class="section-head">
        <div>
          <span class="eyebrow">${fa ? "فهرست زمانی" : "CHRONOLOGICAL INDEX"}</span>
          <h1>${fa ? "آرشیو مقالات" : "Archive"}</h1>
        </div>
      </div>
      <div class="archive-list">
        ${posts
          .map(
            (post) => `
          <a href="${p}/essays/${post.slug}" data-link class="archive-row">
            <span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--ink-muted)">${post.dateFormatted}</span>
            <strong style="font-size:1.15rem">${post.title}</strong>
            <span class="pill-btn">${post.readingLabel}</span>
          </a>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSearch(locale: Locale): string {
  const fa = locale === "fa";
  return `
    <section class="container section-block" style="border-top:0">
      <div class="section-head">
        <div>
          <span class="eyebrow">${fa ? "جستجوی تمام‌متن" : "FULL-TEXT SEARCH"}</span>
          <h1>${fa ? "جستجو در مقالات، پروژه‌ها و یادداشت‌ها" : "Search Essays, Projects & Notes"}</h1>
        </div>
      </div>
      <input type="search" class="search-input" data-search-input placeholder="${fa ? "عبارت مورد نظر را تایپ کنید (مثلاً FSRS، Godot، Gateway)..." : "Type to search (e.g. FSRS, Godot, Gateway, MCP)..."}" autofocus />
      <div class="essay-grid" data-search-results></div>
    </section>
  `;
}

function bindSearch(locale: Locale) {
  const input = document.querySelector<HTMLInputElement>("[data-search-input]");
  const resultsEl = document.querySelector<HTMLElement>("[data-search-results]");
  if (!input || !resultsEl) return;
  const fa = locale === "fa";
  const p = prefixFor(locale);

  const run = () => {
    const q = input.value.trim().toLowerCase();
    const posts = DATA.posts[locale].filter(
      (x) => !q || x.title.toLowerCase().includes(q) || x.subtitle.toLowerCase().includes(q) || x.plainText.toLowerCase().includes(q)
    );
    const projects = DATA.projects.filter(
      (x) =>
        !q ||
        x.name.toLowerCase().includes(q) ||
        x.stack.toLowerCase().includes(q) ||
        (fa ? x.descFa : x.desc).toLowerCase().includes(q)
    );

    const cards = [
      ...posts.map(
        (post) => `
        <a href="${p}/essays/${post.slug}" data-link class="essay-card">
          <div class="essay-card__body">
            <div class="essay-card__meta"><span>${fa ? "مقاله" : "ESSAY"}</span><span>${post.dateFormatted}</span></div>
            <h3 class="essay-card__title">${post.title}</h3>
            <p class="essay-card__excerpt">${post.subtitle}</p>
          </div>
        </a>`
      ),
      ...projects.map(
        (proj) => `
        <a href="${proj.repo}" target="_blank" rel="noopener noreferrer" class="essay-card">
          <div class="essay-card__body">
            <div class="essay-card__meta"><span>${fa ? "پروژه" : "PROJECT"}</span><span>${proj.year}</span></div>
            <h3 class="essay-card__title">${proj.name}</h3>
            <p class="essay-card__excerpt">${fa ? proj.descFa : proj.desc}</p>
          </div>
        </a>`
      ),
    ];

    resultsEl.innerHTML = cards.length
      ? cards.join("")
      : `<p style="color:var(--ink-muted)">${fa ? "نتیجه‌ای یافت نشد." : "No matching entries found."}</p>`;
  };

  input.addEventListener("input", run);
  run();
}

async function mountInteractive(route: string, locale: Locale) {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

  // Lazy-load Hero WebGL slice reveal on desktop (log any failure; keep static portrait fallback)
  if (route === "home") {
    const heroHost = document.querySelector<HTMLElement>("[data-hero-canvas]");
    if (!isDesktop) {
      console.info("[HeroSliceReveal] mobile viewport (<1024px) — using static portrait fallback");
    } else if (heroHost) {
      try {
        const { mountHeroSliceReveal } = await import("./webgl/HeroSliceReveal");
        activeHero = mountHeroSliceReveal(heroHost, asset("assets/shots/avatar.webp"));
      } catch (err) {
        console.warn("[HeroSliceReveal] WebGL unavailable — using static portrait fallback:", err);
      }
    }
  }

  // Update persistent ambient 3D background mode
  ambientScene?.setRouteMode(route === "home" ? "home" : route === "essay" ? "essay" : "other");

  if (prefersReduced) {
    console.info("[Motion] prefers-reduced-motion active — Lenis disabled, ambient 3D static frame");
  }
  activeMotion = initPageMotion(ambientScene);

  // Reading progress bar on article pages
  const fill = document.querySelector<HTMLElement>("[data-reading-fill]");
  if (fill) {
    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      fill.style.width = `${Math.min(100, Math.max(0, (window.scrollY / max) * 100))}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    scrollCleanup = () => window.removeEventListener("scroll", onScroll);
  }

  // Copy code buttons with visible "Copied" / "کپی شد" feedback
  const copiedText = locale === "fa" ? "کپی شد" : "Copied";
  document.querySelectorAll<HTMLButtonElement>("[data-copy-code]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.closest(".code-block")?.querySelector("code")?.textContent || "";
      navigator.clipboard?.writeText(code).catch(() => {});
      const prev = btn.dataset.origLabel || btn.textContent || "Copy";
      btn.dataset.origLabel = prev;
      btn.textContent = copiedText;
      btn.classList.add("is-copied");
      setTimeout(() => {
        btn.textContent = prev;
        btn.classList.remove("is-copied");
      }, 1500);
    });
  });

  // Mobile menu toggle
  const menuBtn = document.querySelector<HTMLButtonElement>("[data-menu-toggle]");
  const drawer = document.querySelector<HTMLElement>("[data-mobile-drawer]");
  menuBtn?.addEventListener("click", () => {
    const open = drawer?.classList.toggle("is-open") ?? false;
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  // Projects lightbox
  const lb = document.querySelector<HTMLElement>("[data-lightbox]");
  const lbImg = document.querySelector<HTMLImageElement>("[data-lightbox-img]");
  const lbCap = document.querySelector<HTMLElement>("[data-lightbox-caption]");
  const closeLb = () => lb?.classList.remove("is-open");
  document.querySelectorAll<HTMLElement>("[data-lightbox-src]").forEach((el) => {
    el.addEventListener("click", () => {
      if (!lb || !lbImg || !lbCap) return;
      lbImg.src = el.dataset.lightboxSrc || "";
      lbImg.alt = el.dataset.lightboxTitle || "";
      lbCap.textContent = el.dataset.lightboxTitle || "";
      lb.classList.add("is-open");
    });
  });
  document.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLb);
  lb?.addEventListener("click", (e) => {
    if (e.target === lb) closeLb();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeLb();
  };
  window.addEventListener("keydown", onKey);
  const prevCleanup = scrollCleanup;
  scrollCleanup = () => {
    prevCleanup?.();
    window.removeEventListener("keydown", onKey);
  };
}

function renderCurrentRoute() {
  cleanupActive();
  const { locale, route, slug } = parseRoute(window.location.pathname);

  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  document.title = locale === "fa" ? "محسن نیک‌سیرت — وبلاگ مهندسی و پروژه‌ها" : "Mohsen Niksirat — Engineering Blog & Systems";

  let mainHtml = "";
  if (route === "home") mainHtml = renderHome(locale);
  else if (route === "essays") mainHtml = renderEssays(locale);
  else if (route === "essay" && slug) mainHtml = renderEssayDetail(locale, slug);
  else if (route === "projects") mainHtml = renderProjects(locale);
  else if (route === "notes") mainHtml = renderNotes(locale);
  else if (route === "about") mainHtml = renderAbout(locale);
  else if (route === "archive") mainHtml = renderArchive(locale);
  else if (route === "search") mainHtml = renderSearch(locale);

  app.innerHTML = renderShell(locale, route, mainHtml, route === "essay");
  window.scrollTo(0, 0);

  if (route === "search") bindSearch(locale);
  void mountInteractive(route, locale);
}

document.addEventListener("click", (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-link]");
  if (!link) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  const href = link.getAttribute("href") || BASE;
  if (href === window.location.pathname) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    window.history.pushState({}, "", href);
    renderCurrentRoute();
    return;
  }

  curtain.classList.remove("is-out");
  curtain.classList.add("is-in");
  setTimeout(() => {
    window.history.pushState({}, "", href);
    renderCurrentRoute();
    curtain.classList.remove("is-in");
    curtain.classList.add("is-out");
    setTimeout(() => curtain.classList.remove("is-out"), 210);
  }, 190);
});

window.addEventListener("popstate", renderCurrentRoute);
renderCurrentRoute();

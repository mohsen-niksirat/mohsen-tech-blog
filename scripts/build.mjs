import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIAGRAMS } from "./diagrams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_ORIGIN = "https://mohsen-niksirat.github.io";
const BASE = "/mohsen-tech-blog";
const FULL_URL = `${SITE_ORIGIN}${BASE}`;

// ─── Utilities ───────────────────────────────────────────────────────────────

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const toFaDigits = (val) => String(val).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function formatDate(iso, locale = "en") {
  const d = new Date(`${iso}T12:00:00Z`);
  if (locale === "fa") {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

// ─── Real Visual Covers Per Monograph ────────────────────────────────────────

const POST_VISUALS = {
  "multi-provider-ai-gateway": {
    src: `${BASE}/assets/shots/9router.webp`,
    w: 800,
    h: 450,
    alt: "9router universal multi-provider AI gateway routing across Gemini, Groq, DeepSeek, OpenAI, and OpenRouter.",
    altFa: "نمای سیستم درگاه چندسرویس‌دهنده 9router برای مدیریت و مسیریابی مدل‌های Gemini، Groq و DeepSeek.",
    caption: "9router multi-provider gateway & Telegram Mini App routing console",
    captionFa: "پلتفرم 9router و مینی‌اپ تلگرام برای چرخش هوشمند کلیدهای هوش مصنوعی",
  },
  "fsrs-spaced-repetition-architecture": {
    src: `${BASE}/assets/shots/leitner-pro-max.webp`,
    w: 800,
    h: 406,
    alt: "Readner Leitner Pro Max interface showing CEFR vocabulary decks alongside PDF reading workspace.",
    altFa: "محیط کاربری Readner لایتنر پرو مکس شامل بسته‌های واژگان CEFR و خواننده PDF.",
    caption: "Readner offline PWA combining FSRS scheduling with live PDF word extraction",
    captionFa: "وب‌اپ آفلاین Readner با ترکیب الگوریتم FSRS و استخراج لغت از فایل PDF",
  },
  "browser-only-developer-tools": {
    src: `${BASE}/assets/shots/repodest.webp`,
    w: 800,
    h: 500,
    alt: "Repodest client-side GitHub repository analyzer displaying repository health score and file explorer.",
    altFa: "داشبورد تحلیلگر کاملاً محلی Repodest برای امتیاز سلامت مخزن و بسته‌بندی فایل‌های کد.",
    caption: "Repodest analyzing GitHub repositories and packing LLM prompts purely client-side",
    captionFa: "ابزار Repodest برای تحلیل مخزن‌های گیت‌هاب و ساخت پرامپت هوش مصنوعی کاملاً در مرورگر",
  },
  "godot4-wasm-horde-survival": {
    src: `${BASE}/assets/shots/horde-survival-3d.webp`,
    w: 800,
    h: 403,
    alt: "Horde Survival 3D running at 60 FPS inside WebGL 2 with active swarm combat and XP pickups.",
    altFa: "گیم‌پلی ۶۰ فریم بازی سه‌بعدی Horde Survival 3D اجراشده در مرورگر با WebGL 2.",
    caption: "Horde Survival 3D WebAssembly gameplay running in browser",
    captionFa: "اجرای زنده بازی بقای سه‌بعدی Horde Survival 3D در مرورگر",
  },
  "inspecting-mcp-servers-visually": {
    src: `${BASE}/assets/shots/mcp-studio.webp`,
    w: 800,
    h: 500,
    alt: "MCP Studio IDE testing Model Context Protocol tool schemas and inspecting JSON-RPC responses.",
    altFa: "محیط استودیوی گرافیکی MCP Studio برای بررسی اسکیمای ابزارها و ترافیک JSON-RPC.",
    caption: "MCP Studio visual workbench for Model Context Protocol servers",
    captionFa: "محیط گرافیکی MCP Studio برای تست ابزارهای استاندارد MCP",
  },
  "deterministic-canvas-cs-animations": {
    src: `${BASE}/assets/shots/codevis.webp`,
    w: 800,
    h: 420,
    alt: "CodeVis interactive HTML5 Canvas visualizer stepping through algorithms with synchronized code highlights.",
    altFa: "محیط آموزش بصری CodeVis با نمایش همزمان گرافیک Canvas و خط فعال کد.",
    caption: "CodeVis stepping deterministically through 49 computer science concepts",
    captionFa: "آموزش گام‌به‌گام ۴۹ مفهوم علوم کامپیوتر روی بوم Canvas در CodeVis",
  },
};

// ─── Single-Pass Code Syntax Highlighter ─────────────────────────────────────

const TOKEN_RE =
  /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(async|await|break|case|catch|class|const|continue|default|else|export|extends|false|finally|for|from|func|function|if|import|in|interface|let|new|null|pass|return|static|struct|switch|throw|true|try|type|typeof|undefined|var|void|while)\b|\b(Array|Buffer|Date|Dictionary|Error|Float32Array|JSON|Map|Math|Number|Object|PackedInt32Array|PackedVector3Array|Promise|RefCounted|RegExp|Set|String|TextEncoder|Uint8Array|Vector3|console|crypto|window|document)\b|\b(\d+(?:_\d+)*(?:\.\d+)?)\b|\b([a-zA-Z_]\w*)(?=\s*\()/g;

function highlightCode(raw) {
  let out = "";
  let last = 0;
  for (const m of raw.matchAll(TOKEN_RE)) {
    out += esc(raw.slice(last, m.index));
    const [full, cmt, str, kw, typ, num, fn] = m;
    if (cmt) out += `<span class="tok-cmt">${esc(full)}</span>`;
    else if (str) out += `<span class="tok-str">${esc(full)}</span>`;
    else if (kw) out += `<span class="tok-kw">${esc(full)}</span>`;
    else if (typ) out += `<span class="tok-typ">${esc(full)}</span>`;
    else if (num) out += `<span class="tok-num">${esc(full)}</span>`;
    else if (fn) out += `<span class="tok-fn">${esc(full)}</span>`;
    else out += esc(full);
    last = m.index + full.length;
  }
  out += esc(raw.slice(last));
  return out;
}

// ─── Lightweight Markdown + Frontmatter Compiler ─────────────────────────────

function parseFrontmatter(raw) {
  const norm = raw.replace(/\r\n/g, "\n");
  const match = norm.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[key] = val
        .slice(1, -1)
        .split(",")
        .map((x) => x.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (val === "true" || val === "false") {
      meta[key] = val === "true";
    } else {
      meta[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: match[2].trim() };
}

function renderInline(text) {
  return text
    .split(/(`[^`]+`)/g)
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return `<code>${esc(part.slice(1, -1))}</code>`;
      }
      let s = esc(part);
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        const external = /^https?:\/\//.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${href}"${attrs}>${label}</a>`;
      });
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      return s;
    })
    .join("");
}

function renderMarkdown(md, locale = "en", diagramKey = "") {
  const codeBlocks = [];
  const withPlaceholders = md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const cleanCode = code.replace(/\n$/, "");
    const langLabel = (lang || "text").toUpperCase();
    const copyLabel = locale === "fa" ? "کپی کد" : "Copy";
    codeBlocks.push(
      `<div class="code-block">
        <div class="code-head"><span>${esc(langLabel)}</span><button type="button" class="copy-btn" data-copy-code>${copyLabel}</button></div>
        <pre><code>${highlightCode(cleanCode)}</code></pre>
      </div>`
    );
    return `@@CODEBLOCK_${idx}@@`;
  });

  const toc = [];
  let secSeq = 0;
  const blocks = withPlaceholders.split(/\n{2,}/);
  const htmlParts = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    if (block === "{{DIAGRAM}}") {
      if (diagramKey && DIAGRAMS[diagramKey]) {
        htmlParts.push(DIAGRAMS[diagramKey](locale));
      }
      continue;
    }

    const codeMatch = block.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (codeMatch) {
      htmlParts.push(codeBlocks[Number(codeMatch[1])]);
      continue;
    }

    if (block.startsWith("### ")) {
      const text = block.slice(4).trim();
      const id = `sec-${++secSeq}`;
      toc.push({ id, text, level: 3 });
      htmlParts.push(`<h3 id="${id}">${renderInline(text)}</h3>`);
      continue;
    }

    if (block.startsWith("## ")) {
      const text = block.slice(3).trim();
      const id = `sec-${++secSeq}`;
      toc.push({ id, text, level: 2 });
      htmlParts.push(`<h2 id="${id}">${renderInline(text)}</h2>`);
      continue;
    }

    if (block.startsWith("> ")) {
      const inner = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join(" ");
      htmlParts.push(`<blockquote><p>${renderInline(inner)}</p></blockquote>`);
      continue;
    }

    const lines = block.split("\n");
    if (lines.every((l) => /^(\*|-)\s+/.test(l.trim()))) {
      const items = lines
        .map((l) => `<li>${renderInline(l.trim().replace(/^(\*|-)\s+/, ""))}</li>`)
        .join("");
      htmlParts.push(`<ul>${items}</ul>`);
      continue;
    }

    if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      const items = lines
        .map((l) => `<li>${renderInline(l.trim().replace(/^\d+\.\s+/, ""))}</li>`)
        .join("");
      htmlParts.push(`<ol>${items}</ol>`);
      continue;
    }

    htmlParts.push(`<p>${renderInline(lines.join(" "))}</p>`);
  }

  return { html: htmlParts.join("\n"), toc };
}

// ─── Unified 1.75px Stroke SVG Iconography ───────────────────────────────────

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  rss: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  zoom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
};

// ─── Real Shipped Projects Showcase Data ─────────────────────────────────────

const PROJECTS = [
  {
    name: "Repodest",
    stack: "JavaScript · GitHub REST API · Chrome MV3",
    shot: `${BASE}/assets/shots/repodest.webp`,
    essaySlug: "browser-only-developer-tools",
    desc: "Client-side GitHub repository health analyzer and token-aware Markdown prompt packer for ChatGPT, Claude, and Gemini.",
    descFa: "تحلیلگر کاملاً سمت کاربر برای مخزن‌های گیت‌هاب همراه با محاسبه امتیاز سلامت و بسته‌بندی فایل‌ها برای مدل‌های زبانی.",
    live: "https://mohsen-niksirat.github.io/Repodest/",
    repo: "https://github.com/mohsen-niksirat/Repodest",
  },
  {
    name: "Readner · Leitner Pro Max",
    stack: "PWA · IndexedDB · FSRS · Kotlin Android",
    shot: `${BASE}/assets/shots/leitner-pro-max.webp`,
    essaySlug: "fsrs-spaced-repetition-architecture",
    desc: "Offline-first vocabulary suite combining FSRS spaced repetition, an integrated PDF reader, WordWeb semantic graphs, and 4,500+ CEFR words.",
    descFa: "مجموعه یادگیری واژگان آفلاین مجهز به زمان‌بند علمی FSRS، خواننده PDF، شبکه معنایی WordWeb و ۴٬۵۰۰ لغت سطح‌بندی‌شده CEFR.",
    live: "https://mohsen-niksirat.github.io/Leitner-Pro-Max/",
    repo: "https://github.com/mohsen-niksirat/Leitner-Pro-Max",
  },
  {
    name: "9router AI Gateway",
    stack: "JavaScript · Serverless · Telegram Mini App",
    shot: `${BASE}/assets/shots/9router.webp`,
    essaySlug: "multi-provider-ai-gateway",
    desc: "Multi-provider AI gateway pooling Gemini, Groq, DeepSeek, OpenAI, and OpenRouter keys with automatic HTTP 429 failover and AES-GCM vaults.",
    descFa: "درگاه چندسرویس‌دهنده هوش مصنوعی و مینی‌اپ تلگرام با توزیع بار کلیدها، جایگزینی خودکار روی خطای ۴۲۹ و رمزنگاری اختصاصی.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/9router_TG_Bot",
  },
  {
    name: "Horde Survival 3D",
    stack: "Godot 4 · GDScript · WebAssembly / WebGL",
    shot: `${BASE}/assets/shots/horde-survival-3d.webp`,
    essaySlug: "godot4-wasm-horde-survival",
    desc: "Browser-playable 3D survival roguelite running at 60 FPS with spatial-hash swarm combat, evolving weapons, and a three-phase boss.",
    descFa: "بازی بقای روگ‌لایت سه‌بعدی با خروجی WebAssembly در مرورگر، برخورد مکانی بهینه، ارتقای سلاح‌ها و مبارزه با باس سه‌فازی.",
    live: "https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/",
    repo: "https://github.com/mohsen-niksirat/Horde_Survival_3D_Godot",
  },
  {
    name: "MCP Studio",
    stack: "TypeScript · JSON-RPC 2.0 · JSON Schema",
    shot: `${BASE}/assets/shots/mcp-studio.webp`,
    essaySlug: "inspecting-mcp-servers-visually",
    desc: "Visual browser workbench for inspecting Model Context Protocol tool schemas, testing invocations, and tracing JSON-RPC payloads.",
    descFa: "استودیوی گرافیکی تست و بازرسی سرورهای استاندارد MCP، فرم‌ساز خودکار از اسکیمای ابزارها و ردیاب پیام‌های JSON-RPC.",
    live: "https://mohsen-niksirat.github.io/Mcp-Studio/",
    repo: "https://github.com/mohsen-niksirat/Mcp-Studio",
  },
  {
    name: "CodeVis",
    stack: "HTML5 Canvas · Zero Dependencies · Single File",
    shot: `${BASE}/assets/shots/codevis.webp`,
    essaySlug: "deterministic-canvas-cs-animations",
    desc: "49 computer science algorithms and patterns animated step-by-step with bidirectional timeline scrubbing and synced code pointers.",
    descFa: "آموزش تعاملی ۴۹ مفهوم علوم کامپیوتر روی بوم Canvas با قابلیت حرکت دوطرفه بین گام‌ها و هایلایت همگام کد.",
    live: "https://mohsen-niksirat.github.io/CodeVis/",
    repo: "https://github.com/mohsen-niksirat/CodeVis",
  },
  {
    name: "DataLens",
    stack: "JavaScript · SVG Charts · Offline PWA",
    shot: `${BASE}/assets/shots/datalens.webp`,
    essaySlug: "browser-only-developer-tools",
    desc: "Zero-upload in-browser data workbench supporting CSV, JSON, YAML, XML, SQL, and Excel inspection and conversion.",
    descFa: "میزکار تحلیل، آمارگیری و تبدیل فایل‌های داده در ۶ فرمت مختلف کاملاً آفلاین و بدون ارسال فایل به سرور.",
    live: "https://mohsen-niksirat.github.io/DataLens/",
    repo: "https://github.com/mohsen-niksirat/DataLens",
  },
  {
    name: "SpeakAI Coach",
    stack: "TypeScript · Voice AI · PWA",
    shot: `${BASE}/assets/shots/speakai-coach.webp`,
    desc: "Real-time spoken English conversation tutor with 8 personas, turn-by-turn grammar feedback, and 6-axis IELTS Speaking band estimation.",
    descFa: "مربی هوشمند مکالمه صوتی انگلیسی همراه با ۸ نقش گفتگو، اصلاح لحظه‌ای گرامر و تخمین شش‌محوری نمره اسپیکینگ آیلتس.",
    live: "https://mohsen-niksirat.github.io/SpeakAI-Coach/",
    repo: "https://github.com/mohsen-niksirat/SpeakAI-Coach",
  },
  {
    name: "A11y Inspector",
    stack: "JavaScript · WCAG 2.2 · PWA + Node CLI",
    shot: `${BASE}/assets/shots/a11y-inspector.webp`,
    essaySlug: "browser-only-developer-tools",
    desc: "Privacy-first HTML accessibility auditor checking contrast ratios, landmarks, headings, and ARIA rules in-browser and in CI.",
    descFa: "ابزار ممیزی دسترس‌پذیری وب بر اساس استاندارد WCAG 2.2 در مرورگر به‌همراه نسخه خط فرمان برای بررسی خودکار در CI.",
    live: "https://mohsen-niksirat.github.io/A11y-Inspector/",
    repo: "https://github.com/mohsen-niksirat/A11y-Inspector",
  },
  {
    name: "AIDahl",
    stack: "Python · OpenRouter · Supabase · Telegram",
    shot: `${BASE}/assets/shots/aidahl.webp`,
    essaySlug: "multi-provider-ai-gateway",
    desc: "Bring-Your-Own-Key Telegram AI assistant featuring live coalesced SSE streaming, named threads, and Manus research/image workflows.",
    descFa: "دستیار هوش مصنوعی تلگرام با معماری BYOK، استریم زنده پیام‌ها، گفتگوهای نام‌گذاری‌شده و ابزارهای تولید تصویر و پژوهش.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/AIDahl",
  },
  {
    name: "Kite Downloader",
    stack: "Rust · Tauri v2 · Tokio Async",
    shot: `${BASE}/assets/shots/kite-downloader.webp`,
    desc: "Lightweight native Windows download manager under 8 MB featuring segmented range downloads and clipboard sniffing.",
    descFa: "مدیریت دانلود سبک و سریع دسکتاپ با Rust و Tauri v2 با حجم زیر ۸ مگابایت و دانلود چندبخشی فایل‌ها.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/kite-downloader",
  },
  {
    name: "Interactive macOS & iOS Portfolio",
    stack: "React 19 · Vite · Tailwind 4 · GSAP",
    shot: `${BASE}/assets/shots/macos-portfolio.png`,
    desc: "Bilingual desktop and mobile operating-system portfolio featuring Finder, Safari case studies, zsh Terminal, Spotlight, and live GitHub telemetry.",
    descFa: "پورتفولیوی تعاملی دوزبانه به سبک سیستم‌عامل macOS و iOS مجهز به ترمینال، مرورگر پروژه‌ها، ویجت‌های زنده و رزومه.",
    live: "https://mohsen-niksirat.github.io/Profile/",
    repo: "https://github.com/mohsen-niksirat/Profile",
  },
];

// ─── Layout Shell ────────────────────────────────────────────────────────────

function renderShell({
  locale = "en",
  title,
  description,
  canonicalPath,
  altLangPath,
  activeNav = "",
  ogImage = `${FULL_URL}/assets/og/og-default.png`,
  jsonLd = null,
  readingBar = false,
  bodyHtml,
}) {
  const fa = locale === "fa";
  const prefix = fa ? `${BASE}/fa` : BASE;
  const canonicalUrl = `${FULL_URL}${canonicalPath}`;
  const altUrl = `${FULL_URL}${altLangPath}`;

  const navItems = fa
    ? [
        { key: "home", label: "مقالات", href: `${prefix}/` },
        { key: "notes", label: "یادداشت‌های فنی", href: `${prefix}/notes/` },
        { key: "projects", label: "گالری پروژه‌ها", href: `${prefix}/projects/` },
        { key: "archive", label: "آرشیو", href: `${prefix}/archive/` },
        { key: "about", label: "درباره من", href: `${prefix}/about/` },
      ]
    : [
        { key: "home", label: "Essays", href: `${prefix}/` },
        { key: "notes", label: "Field Notes", href: `${prefix}/notes/` },
        { key: "projects", label: "Systems", href: `${prefix}/projects/` },
        { key: "archive", label: "Archive", href: `${prefix}/archive/` },
        { key: "about", label: "About", href: `${prefix}/about/` },
      ];

  const siteName = fa ? "نشریه مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Publication";
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;

  return `<!DOCTYPE html>
<html lang="${fa ? "fa" : "en"}" dir="${fa ? "rtl" : "ltr"}" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="author" content="${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <link rel="alternate" hreflang="${fa ? "fa" : "en"}" href="${esc(canonicalUrl)}">
  <link rel="alternate" hreflang="${fa ? "en" : "fa"}" href="${esc(altUrl)}">
  <link rel="alternate" type="application/rss+xml" title="${esc(siteName)}" href="${fa ? `${FULL_URL}/fa/feed.xml` : `${FULL_URL}/feed.xml`}">

  <meta property="og:type" content="${readingBar ? "article" : "website"}">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${esc(ogImage)}">

  <link rel="icon" href="${BASE}/assets/icons/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="${BASE}/assets/icons/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="${BASE}/assets/icons/apple-touch-icon.png">
  <link rel="manifest" href="${BASE}/manifest.webmanifest">

  <script>
    (function(){try{var t=localStorage.getItem("mtb-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}var s=localStorage.getItem("mtb-font-size");if(s&&s!=="md"){document.documentElement.setAttribute("data-font-size",s);}}catch(_){}})();
  </script>
  <link rel="stylesheet" href="${BASE}/assets/style.css">
  <script defer src="${BASE}/assets/app.js"></script>
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body>
  <a class="skip-link" href="#main-content">${fa ? "پرش به محتوای اصلی" : "Skip to main content"}</a>
  ${readingBar ? `<div class="reading-progress" aria-hidden="true"></div>` : ""}

  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="${prefix}/">
        <span class="brand-mark" aria-hidden="true">MN</span>
        <span class="brand-text">
          <span class="brand-name">${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}</span>
          <span class="brand-sub">${fa ? "نشریه مهندسی نرم‌افزار و هوش مصنوعی" : "Engineering Publication & Lab"}</span>
        </span>
      </a>

      <nav class="primary-nav" aria-label="${fa ? "ناوبری اصلی" : "Primary navigation"}">
        ${navItems
          .map(
            (item) =>
              `<a class="nav-link" href="${item.href}"${activeNav === item.key ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`
          )
          .join("")}
      </nav>

      <div class="header-tools">
        <button type="button" class="tool-btn" data-open-search aria-label="${fa ? "جستجو در مقالات (Ctrl+K)" : "Search essays and notes (Ctrl+K)"}">
          ${ICONS.search}
          <span class="search-btn-label">${fa ? "جستجو" : "Search"}</span>
          <kbd class="kbd-hint">⌘K</kbd>
        </button>

        <a class="tool-btn" href="${BASE}${altLangPath}" hreflang="${fa ? "en" : "fa"}" aria-label="${fa ? "مشاهده نسخه انگلیسی" : "Read Persian edition"}">
          ${fa ? "EN" : "فارسی"}
        </a>

        <button type="button" class="tool-btn" data-theme-toggle aria-label="${fa ? "تغییر پوسته روشن یا تاریک" : "Toggle color theme"}">
          ${ICONS.theme}
        </button>

        <button type="button" class="tool-btn mobile-menu-btn" data-mobile-menu-btn aria-expanded="false" aria-controls="mobile-drawer" aria-label="${fa ? "باز کردن منو" : "Toggle menu"}">
          ${ICONS.menu}
        </button>
      </div>
    </div>

    <div class="mobile-drawer" id="mobile-drawer">
      <nav aria-label="${fa ? "منوی موبایل" : "Mobile navigation"}">
        ${navItems
          .map(
            (item) =>
              `<a class="nav-link" href="${item.href}"${activeNav === item.key ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`
          )
          .join("")}
      </nav>
    </div>
  </header>

  <main id="main-content" class="shell">
    ${bodyHtml}
  </main>

  <footer class="site-footer">
    <div class="shell footer-inner">
      <p>${
        fa
          ? `© ${toFaDigits(2026)} محسن نیک‌سیرت · مهندس نرم‌افزار و پژوهشگر معماری کامپیوتر (تبریز)`
          : "© 2026 Mohsen Niksirat · M.Sc. Computer Architecture · Open-Source Builder"
      }</p>
      <div class="footer-links">
        <a href="https://mohsen-niksirat.github.io/Profile/${fa ? "fa/" : ""}" target="_blank" rel="noopener noreferrer">${fa ? "پورتفولیوی تعاملی macOS" : "Interactive OS Portfolio"}</a>
        <a href="https://github.com/mohsen-niksirat" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://t.me/mohsenniksirat" target="_blank" rel="noopener noreferrer">Telegram</a>
        <a href="${fa ? `${BASE}/fa/search/` : `${BASE}/search/`}">${fa ? "جستجو" : "Search"}</a>
        <a href="${fa ? `${BASE}/fa/feed.xml` : `${BASE}/feed.xml`}">RSS</a>
      </div>
    </div>
  </footer>

  <!-- Instant Command / Search Modal -->
  <div class="search-dialog-backdrop" id="search-backdrop" hidden>
    <div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-modal-label">
      <div class="dialog-head">
        ${ICONS.search}
        <label id="search-modal-label" for="search-modal-input" class="skip-link">${fa ? "عبارت جستجو" : "Search query"}</label>
        <input id="search-modal-input" type="search" autocomplete="off" placeholder="${
          fa ? "جستجو در مقالات و یادداشت‌ها (مثلاً FSRS، 9router، WebAssembly)..." : "Search essays, architectures, or topics (e.g. FSRS, 9router, MCP)..."
        }">
        <button type="button" class="tool-btn" data-close-search>${fa ? "بستن" : "Esc"}</button>
      </div>
      <ul class="dialog-results" id="search-modal-results"></ul>
    </div>
  </div>

  <!-- Image Lightbox Modal -->
  <div class="lightbox-backdrop" id="lightbox-backdrop" hidden>
    <div class="lightbox-panel" role="dialog" aria-modal="true" aria-labelledby="lightbox-caption">
      <div class="lightbox-bar">
        <p id="lightbox-caption"></p>
        <button type="button" class="tool-btn" data-close-lightbox>${fa ? "بستن (Esc)" : "Close (Esc)"}</button>
      </div>
      <img id="lightbox-img" alt="">
    </div>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</body>
</html>`;
}

// ─── Load Content ────────────────────────────────────────────────────────────

function loadPosts(locale) {
  const dir = path.join(ROOT, "content", "posts", locale);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const words = body.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
    const mins = Math.max(4, Math.round(words / 185));
    const readTime = locale === "fa" ? `${toFaDigits(mins)} دقیقه مطالعه` : `${mins} min read`;
    const { html, toc } = renderMarkdown(body, locale, meta.diagram);
    const urlPath = locale === "fa" ? `/fa/posts/${meta.slug}/` : `/posts/${meta.slug}/`;
    const altPath = locale === "fa" ? `/posts/${meta.slug}/` : `/fa/posts/${meta.slug}/`;
    const visual = POST_VISUALS[meta.slug] || {
      src: `${BASE}/assets/og/${meta.slug}.png`,
      w: 1200,
      h: 630,
      alt: meta.title,
      altFa: meta.title,
      caption: meta.projectName || meta.title,
      captionFa: meta.projectName || meta.title,
    };

    return {
      ...meta,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      locale,
      visual,
      bodyRaw: body.replace(/\{\{DIAGRAM\}\}/g, "").replace(/[#*`>_]/g, " "),
      html,
      toc,
      mins,
      readTime,
      dateLabel: formatDate(meta.date, locale),
      url: `${BASE}${urlPath}`,
      canonicalPath: urlPath,
      altPath,
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

const notesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "notes.json"), "utf8"));

function writeOut(relPath, contents) {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents, "utf8");
}

// ─── Page Builders ───────────────────────────────────────────────────────────

function buildHomePage(posts, locale) {
  const fa = locale === "fa";
  const prefix = fa ? `${BASE}/fa` : BASE;
  const lead = posts.find((p) => p.featured) || posts[0];
  const topics = [...new Set(posts.map((p) => p.topic))];
  const showcaseTabs = [
    posts.find((p) => p.slug === "browser-only-developer-tools") || posts[0],
    posts.find((p) => p.slug === "fsrs-spaced-repetition-architecture") || posts[1],
    posts.find((p) => p.slug === "godot4-wasm-horde-survival") || posts[2],
  ];
  const featuredSystems = [PROJECTS[0], PROJECTS[3], PROJECTS[7], PROJECTS[4]];

  const bodyHtml = `
    <!-- 1. Atmospheric Visual Studio Hero with Live Multi-System Showcase -->
    <section class="studio-hero">
      <div class="hero-stage-grid">
        <div class="hero-copy">
          <div class="author-strip">
            <img class="author-avatar" src="${BASE}/assets/shots/avatar.webp" alt="${fa ? "پرتره محسن نیک‌سیرت" : "Portrait of Mohsen Niksirat"}" width="48" height="48">
            <div class="author-meta">
              <strong class="author-name">${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}</strong>
              <span class="author-role">${fa ? "کارشناسی ارشد معماری کامپیوتر · تبریز" : "M.Sc. Computer Architecture · Open-Source Systems Builder"}</span>
            </div>
          </div>

          <h1 class="hero-display">${
            fa
              ? "معماری سیستم‌های هوش مصنوعی، موتورهای یادگیری و ابزارهای وب بدون سرور"
              : "Architecting resilient AI gateways, cognitive engines & zero-backend web software"
          }</h1>

          <p class="hero-lede">${
            fa
              ? "مقالات فنی مصور، دیاگرام‌های تعاملی و تجربه واقعی ساخت ۴۷ مخزن متن‌باز: از توزیع بار مدل‌های زبانی در 9router تا الگوریتم حافظه FSRS در Readner و گرافیک WebAssembly در Godot 4."
              : "Visual engineering essays, interactive architecture sandboxes, and field notes distilled from shipping 47+ open-source repositories across serverless AI routing, FSRS spaced repetition, and WebAssembly engines."
          }</p>

          <div class="btn-row">
            <a class="btn-primary" href="${lead.url}">${fa ? "مطالعه سرمقاله ویژه" : "Read Lead Monograph"}</a>
            <a class="btn-secondary" href="https://mohsen-niksirat.github.io/Profile/${fa ? "fa/" : ""}" target="_blank" rel="noopener noreferrer">${fa ? "ورود به دسکتاپ macOS من" : "Launch OS Portfolio"}</a>
          </div>
        </div>

        <!-- Layered App Visual Showcase Window (hero <img> with fetchpriority="high") -->
        <div class="hero-showcase" data-hero-showcase>
          <div class="showcase-tabs" role="tablist" aria-label="${fa ? "پیش‌نمایش سیستم‌های برجسته" : "Featured engineering systems"}">
            ${showcaseTabs
              .map(
                (item, idx) => `<button type="button" role="tab" class="showcase-tab" data-hero-tab="${idx}" aria-selected="${idx === 0}">${esc(item.projectName.split("·")[0].trim())}</button>`
              )
              .join("")}
          </div>

          ${showcaseTabs
            .map(
              (item, idx) => `<div class="showcase-panel" data-hero-panel="${idx}"${idx === 0 ? "" : " hidden"}>
                <div class="window-chrome">
                  <div class="chrome-dots" aria-hidden="true"><span></span><span></span><span></span></div>
                  <span class="chrome-url ltr">${esc(item.projectLive || item.projectRepo)}</span>
                  <button type="button" class="chrome-zoom" data-lightbox-src="${item.visual.src}" data-lightbox-alt="${esc(fa ? item.visual.altFa : item.visual.alt)}" aria-label="${fa ? "بزرگنمایی تصویر" : "Expand screenshot"}">${ICONS.zoom}</button>
                </div>
                <div class="showcase-img-wrap">
                  <img
                    src="${item.visual.src}"
                    alt="${esc(fa ? item.visual.altFa : item.visual.alt)}"
                    width="${item.visual.w}"
                    height="${item.visual.h}"
                    ${idx === 0 ? 'fetchpriority="high"' : 'decoding="async"'}
                  >
                </div>
                <div class="showcase-foot">
                  <div>
                    <span class="showcase-topic">${esc(item.topic)}</span>
                    <strong class="showcase-title">${esc(item.title)}</strong>
                  </div>
                  <a class="showcase-read" href="${item.url}">${fa ? "خواندن مقاله" : "Read Essay"}</a>
                </div>
              </div>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- 2. Lead Monograph Interactive Failover Sandbox Spread -->
    <section class="lead-spread" aria-labelledby="lead-essay-heading" data-reveal>
      <div class="lead-grid">
        <div>
          <span class="section-pill">${fa ? "شبیه‌ساز زنده معماری" : "Interactive Architecture Study"}</span>
          <h2 id="lead-essay-heading" class="lead-heading">
            <a href="${lead.url}">${esc(lead.title)}</a>
          </h2>
          <p class="lead-summary">${esc(lead.summary)}</p>
          <div class="meta-row tabular">
            <span class="topic-label">${esc(lead.topic)}</span>
            <span class="meta-dot" aria-hidden="true">·</span>
            <time datetime="${lead.date}">${esc(lead.dateLabel)}</time>
            <span class="meta-dot" aria-hidden="true">·</span>
            <span>${esc(lead.readTime)}</span>
          </div>
          <div class="btn-row">
            <a class="btn-primary" href="${lead.url}">${fa ? "باز کردن مقاله کامل" : "Read Full Monograph"}</a>
            <a class="btn-secondary" href="${lead.projectRepo}" target="_blank" rel="noopener noreferrer">${fa ? "مشاهده سورس گیت‌هاب" : "Inspect on GitHub"}</a>
          </div>
        </div>
        <div class="lead-visual">
          ${DIAGRAMS[lead.diagram] ? DIAGRAMS[lead.diagram](locale) : ""}
        </div>
      </div>
    </section>

    <!-- 3. Visual Monographs Gallery (16:10 Framed Real Screenshots + Grid/Ledger Switch) -->
    <section class="ledger-section" aria-labelledby="ledger-heading" data-reveal>
      <div class="section-head">
        <div>
          <h2 id="ledger-heading" class="section-title">${fa ? "مقالات مهندسی و کالبدشکافی سیستم‌ها" : "Published Engineering Monographs"}</h2>
          <p class="section-desc">${fa ? "هر مقاله همراه با تصاویر واقعی اپلیکیشن، دیاگرام تعاملی و کد عملی پیاده‌سازی شده است." : "Every essay pairs real application screenshots, interactive schematics, and production source patterns."}</p>
        </div>
        <div class="view-switcher" role="group" aria-label="${fa ? "حالت نمایش مقالات" : "Switch essay layout"}">
          <button type="button" class="view-btn" data-view-mode="grid" aria-pressed="true" aria-label="${fa ? "نمایش کارت‌های تصویری" : "Visual grid view"}">${ICONS.grid}<span>${fa ? "گرافیکی" : "Visual"}</span></button>
          <button type="button" class="view-btn" data-view-mode="ledger" aria-pressed="false" aria-label="${fa ? "نمایش فهرست فشرده" : "Compact ledger view"}">${ICONS.list}<span>${fa ? "فهرستی" : "Index"}</span></button>
        </div>
      </div>

      <div class="filter-bar" role="group" aria-label="${fa ? "فیلتر بر اساس حوزه فنی" : "Filter essays by engineering topic"}">
        <button type="button" class="filter-tab" data-topic-filter="all" aria-pressed="true">
          <span>${fa ? "همه موضوعات" : "All Topics"}</span>
          <span class="filter-count">${fa ? toFaDigits(posts.length) : posts.length}</span>
        </button>
        ${topics
          .map((t) => {
            const count = posts.filter((p) => p.topic === t).length;
            return `<button type="button" class="filter-tab" data-topic-filter="${esc(t)}" aria-pressed="false">
              <span>${esc(t)}</span>
              <span class="filter-count">${fa ? toFaDigits(count) : count}</span>
            </button>`;
          })
          .join("")}
      </div>

      <div class="essay-cards" id="essay-collection" data-layout="grid">
        ${posts
          .map(
            (p) => `<article class="essay-card" data-essay-topic="${esc(p.topic)}">
              <a class="essay-media" href="${p.url}">
                <img
                  src="${p.visual.src}"
                  alt="${esc(fa ? p.visual.altFa : p.visual.alt)}"
                  width="${p.visual.w}"
                  height="${p.visual.h}"
                  loading="lazy"
                  decoding="async"
                >
                <span class="essay-topic-tag">${esc(p.topic)}</span>
              </a>
              <div class="essay-body">
                <div class="essay-meta tabular">
                  <time datetime="${p.date}">${esc(p.dateLabel)}</time>
                  <span class="meta-dot" aria-hidden="true">·</span>
                  <span>${esc(p.readTime)}</span>
                </div>
                <h3><a href="${p.url}">${esc(p.title)}</a></h3>
                <p>${esc(p.summary)}</p>
                <div class="essay-foot">
                  <span class="essay-project ltr">${esc(p.projectName)}</span>
                  <a class="essay-cta" href="${p.url}">${fa ? "مطالعه مقاله" : "Read Monograph"}</a>
                </div>
              </div>
            </article>`
          )
          .join("")}
      </div>

      <div class="empty-state" id="ledger-empty" hidden>
        <p>${fa ? "هیچ مقاله‌ای در این دسته‌بندی یافت نشد." : "No essays match the selected topic."}</p>
        <button type="button" class="btn-secondary" data-reset-filter>${fa ? "نمایش همه مقالات" : "Show all essays"}</button>
      </div>
    </section>

    <!-- 4. Visual Gallery of Live Systems Behind the Essays -->
    <section class="systems-band" aria-labelledby="systems-heading" data-reveal>
      <div class="section-head">
        <div>
          <h2 id="systems-heading" class="section-title">${fa ? "نرم‌افزارها و دموی زنده پشت این مقالات" : "Live Systems Behind the Writing"}</h2>
          <p class="section-desc">${fa ? "نمای مستقیم از رابط کاربری اپلیکیشن‌های اجراشده؛ برای بزرگنمایی روی تصویر کلیک کنید." : "Authentic captures of deployed interfaces running client-side. Click any screenshot to inspect full-size."}</p>
        </div>
        <a href="${prefix}/projects/">${fa ? "مشاهده تمام ۱۲ سیستم" : "Browse all 12 systems"}</a>
      </div>

      <div class="systems-showcase-grid">
        ${featuredSystems
          .map(
            (sys) => `<article class="system-tile">
              <div class="system-shot">
                <img src="${sys.shot}" alt="${esc(sys.name)}" width="800" height="500" loading="lazy" decoding="async">
                <button type="button" class="shot-zoom-btn" data-lightbox-src="${sys.shot}" data-lightbox-alt="${esc(sys.name)}" aria-label="${fa ? `بزرگنمایی ${sys.name}` : `Zoom ${sys.name} screenshot`}">${ICONS.zoom}</button>
              </div>
              <div class="system-tile-body">
                <div class="system-tile-head">
                  <h3>${esc(sys.name)}</h3>
                  <span class="project-stack ltr">${esc(sys.stack)}</span>
                </div>
                <p>${esc(fa ? sys.descFa : sys.desc)}</p>
                <div class="btn-row">
                  ${
                    sys.live
                      ? `<a class="btn-primary btn-sm" href="${esc(sys.live)}" target="_blank" rel="noopener noreferrer">${fa ? "اجرای زنده" : "Open Live"}</a>`
                      : ""
                  }
                  <a class="btn-secondary btn-sm" href="${esc(sys.repo)}" target="_blank" rel="noopener noreferrer">${fa ? "کد گیت‌هاب" : "GitHub"}</a>
                </div>
              </div>
            </article>`
          )
          .join("")}
      </div>
    </section>

    <!-- 5. Recent Lab Field Notes -->
    <section class="notes-section" aria-labelledby="notes-heading" data-reveal>
      <div class="section-head">
        <h2 id="notes-heading" class="section-title">${fa ? "یادداشت‌های آزمایشگاهی و بنچمارک‌ها" : "Recent Lab Field Notes"}</h2>
        <a href="${prefix}/notes/">${fa ? "همه یادداشت‌های فنی" : "Read all field notes"}</a>
      </div>

      <div class="notes-columns">
        ${notesRaw
          .slice(0, 4)
          .map(
            (n) => `<article class="note-entry" id="${esc(n.id)}">
              <div class="note-meta tabular">
                <span class="note-tag">${esc(fa ? n.tagFa : n.tag)}</span>
                <time datetime="${n.date}">${esc(formatDate(n.date, locale))}</time>
              </div>
              <h3>${esc(fa ? n.titleFa : n.title)}</h3>
              <p>${renderInline(fa ? n.bodyFa : n.body)}</p>
              <div class="note-foot">
                <a href="${esc(n.link)}" target="_blank" rel="noopener noreferrer">${esc(n.linkLabel)}</a>
              </div>
            </article>`
          )
          .join("")}
      </div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "نشریه مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Publication",
    description: fa
      ? "مقالات عمیق مهندسی نرم‌افزار، سیستم‌های هوش مصنوعی، الگوریتم FSRS، WebAssembly و ابزارهای وب محلی نوشته محسن نیک‌سیرت."
      : "Visual technical essays, live architecture sandboxes, and field notes by Mohsen Niksirat.",
    canonicalPath: fa ? "/fa/" : "/",
    altLangPath: fa ? "/" : "/fa/",
    activeNav: "home",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: fa ? "نشریه مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Publication",
      url: `${FULL_URL}${fa ? "/fa/" : "/"}`,
      inLanguage: fa ? "fa-IR" : "en-US",
      author: {
        "@type": "Person",
        name: fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat",
        url: "https://mohsen-niksirat.github.io/Profile/",
        sameAs: ["https://github.com/mohsen-niksirat", "https://t.me/mohsenniksirat"],
      },
    },
    bodyHtml,
  });
}

function buildPostPage(post, index, allPosts) {
  const fa = post.locale === "fa";
  const newer = index > 0 ? allPosts[index - 1] : null;
  const older = index < allPosts.length - 1 ? allPosts[index + 1] : null;

  const bodyHtml = `
    <article class="article-wrap">
      <header class="article-header">
        <h1 class="article-title">${esc(post.title)}</h1>
        <p class="article-deck">${esc(post.summary)}</p>
        <div class="meta-row tabular">
          <span class="topic-label">${esc(post.topic)}</span>
          <span class="meta-dot" aria-hidden="true">·</span>
          <time datetime="${post.date}">${esc(post.dateLabel)}</time>
          <span class="meta-dot" aria-hidden="true">·</span>
          <span>${esc(post.readTime)}</span>
          <span class="meta-dot" aria-hidden="true">·</span>
          <a href="${BASE}${post.altPath}" hreflang="${fa ? "en" : "fa"}">${fa ? "Read in English" : "مطالعه به فارسی"}</a>
        </div>
      </header>

      <!-- Framed Real Project Cover Screenshot (R-40 hero <img> with fetchpriority="high") -->
      <figure class="article-cover">
        <div class="window-chrome">
          <div class="chrome-dots" aria-hidden="true"><span></span><span></span><span></span></div>
          <span class="chrome-url ltr">${esc(post.projectLive || post.projectRepo)}</span>
          <button type="button" class="chrome-zoom" data-lightbox-src="${post.visual.src}" data-lightbox-alt="${esc(fa ? post.visual.altFa : post.visual.alt)}" aria-label="${fa ? "بزرگنمایی تصویر" : "Expand screenshot"}">${ICONS.zoom}</button>
        </div>
        <img
          src="${post.visual.src}"
          alt="${esc(fa ? post.visual.altFa : post.visual.alt)}"
          width="${post.visual.w}"
          height="${post.visual.h}"
          fetchpriority="high"
        >
        <figcaption>${esc(fa ? post.visual.captionFa : post.visual.caption)}</figcaption>
      </figure>

      <div class="article-layout">
        <div class="prose">
          ${post.html}

          <section class="artifact-box" aria-label="${fa ? "پروژه متن‌باز مرتبط" : "Related open-source project"}">
            <div>
              <h2>${esc(post.projectName)}</h2>
              <p>${
                fa
                  ? "کد کامل این معماری به‌صورت متن‌باز در گیت‌هاب من در دسترس است."
                  : "Explore the live deployment and full open-source implementation referenced in this monograph."
              }</p>
            </div>
            <div class="btn-row">
              ${
                post.projectLive && post.projectLive !== post.projectRepo
                  ? `<a class="btn-primary" href="${esc(post.projectLive)}" target="_blank" rel="noopener noreferrer">${fa ? "اجرای نسخه زنده" : "Open Live App"}</a>`
                  : ""
              }
              <a class="btn-secondary" href="${esc(post.projectRepo)}" target="_blank" rel="noopener noreferrer">${fa ? "مشاهده سورس در گیت‌هاب" : "View GitHub Repository"}</a>
            </div>
          </section>

          <nav class="post-matrix-nav" aria-label="${fa ? "مقاله قبلی و بعدی" : "Adjacent monographs"}">
            ${
              newer
                ? `<a class="adj-link" href="${newer.url}">
                    <span class="adj-dir">${fa ? "مقاله جدیدتر" : "Newer Monograph"}</span>
                    <span class="adj-title">${esc(newer.title)}</span>
                  </a>`
                : `<div></div>`
            }
            ${
              older
                ? `<a class="adj-link" href="${older.url}">
                    <span class="adj-dir">${fa ? "مقاله پیشین" : "Earlier Monograph"}</span>
                    <span class="adj-title">${esc(older.title)}</span>
                  </a>`
                : `<div></div>`
            }
          </nav>

          <section class="comments-box" aria-labelledby="comments-heading">
            <div class="section-head">
              <h2 id="comments-heading" class="section-title">${fa ? "گفتگوی فنی و دیدگاه‌ها" : "Technical Discussion"}</h2>
              <button type="button" class="tool-btn" data-copy-url>${ICONS.link}<span>${fa ? "کپی لینک مقاله" : "Copy Link"}</span></button>
            </div>
            <p style="margin-bottom:14px;color:var(--text-secondary);font-size:0.93rem;">${
              fa
                ? "دیدگاه‌ها از طریق GitHub Discussions بارگذاری می‌شوند (بدون اسکریپت ردیاب هنگام باز شدن صفحه)؛ یا مستقیماً در تلگرام گفتگو کنید."
                : "Comments load on demand via GitHub Issues so zero third-party scripts run uninvited while you read."
            }</p>
            <div class="btn-row">
              <button type="button" class="btn-secondary" data-load-comments>${fa ? "بارگذاری دیدگاه‌های گیت‌هاب" : "Load GitHub Comments"}</button>
              <a class="btn-secondary" href="https://t.me/mohsenniksirat" target="_blank" rel="noopener noreferrer">${fa ? "ارسال بازخورد در تلگرام" : "Discuss on Telegram"}</a>
            </div>
            <div id="comments-mount" style="margin-top:16px;"></div>
          </section>
        </div>

        <aside class="article-rail" aria-label="${fa ? "فهرست بخش‌ها و ابزار مطالعه" : "Article table of contents and reading tools"}">
          ${
            post.toc.length
              ? `<div class="rail-box">
                  <p class="rail-heading">${fa ? "در این مقاله می‌خوانید" : "On This Page"}</p>
                  <ul class="toc-list">
                    ${post.toc.map((item) => `<li><a href="#${item.id}">${esc(item.text)}</a></li>`).join("")}
                  </ul>
                </div>`
              : ""
          }

          <div class="rail-box">
            <p class="rail-heading">${fa ? "اندازه متن مطالعه" : "Reading Type Scale"}</p>
            <div class="size-controls" role="group" aria-label="${fa ? "تغییر اندازه قلم" : "Adjust article font size"}">
              <button type="button" class="size-btn" data-font-scale="sm" aria-pressed="false">A-</button>
              <button type="button" class="size-btn" data-font-scale="md" aria-pressed="true">A</button>
              <button type="button" class="size-btn" data-font-scale="lg" aria-pressed="false">A+</button>
            </div>
          </div>

          <div class="rail-box">
            <p class="rail-heading">${fa ? "کلیدواژه‌ها" : "Technical Tags"}</p>
            <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.7;">${post.tags.map(esc).join(" · ")}</p>
          </div>
        </aside>
      </div>
    </article>
  `;

  return renderShell({
    locale: post.locale,
    title: post.title,
    description: post.summary,
    canonicalPath: post.canonicalPath,
    altLangPath: post.altPath,
    activeNav: "home",
    ogImage: `${FULL_URL}/assets/og/${post.slug}.png`,
    readingBar: true,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary,
      datePublished: post.date,
      inLanguage: fa ? "fa-IR" : "en-US",
      image: `${FULL_URL}/assets/og/${post.slug}.png`,
      mainEntityOfPage: `${FULL_URL}${post.canonicalPath}`,
      author: {
        "@type": "Person",
        name: fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat",
        url: "https://mohsen-niksirat.github.io/Profile/",
      },
    },
    bodyHtml,
  });
}

function buildNotesPage(locale) {
  const fa = locale === "fa";
  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <h1 class="page-title">${fa ? "یادداشت‌های فنی و آزمایشگاهی" : "Engineering Field Notes"}</h1>
        <p class="page-sub">${
          fa
            ? "یافته‌های کوتاه، بنچمارک‌ها و نکات کاربردی که حین ساخت پروژه‌های واقعی در زمینه رمزنگاری وب، Rust، صدا و رابط‌های راست‌به‌چپ ثبت کرده‌ام."
            : "Concise implementation findings, benchmarks, and architectural micro-decisions recorded while shipping production web, Rust, and AI tools."
        }</p>
      </header>

      <div class="notes-columns">
        ${notesRaw
          .map(
            (n) => `<article class="note-entry" id="${esc(n.id)}">
              <div class="note-meta tabular">
                <span class="note-tag">${esc(fa ? n.tagFa : n.tag)}</span>
                <time datetime="${n.date}">${esc(formatDate(n.date, locale))}</time>
              </div>
              <h2 style="font-family:var(--font-serif);font-size:1.2rem;font-weight:650;">${esc(fa ? n.titleFa : n.title)}</h2>
              <p>${renderInline(fa ? n.bodyFa : n.body)}</p>
              <div class="note-foot">
                <a href="${esc(n.link)}" target="_blank" rel="noopener noreferrer">${esc(n.linkLabel)}</a>
              </div>
            </article>`
          )
          .join("")}
      </div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "یادداشت‌های فنی" : "Field Notes",
    description: fa
      ? "یادداشت‌های کوتاه مهندسی و نکات پیاده‌سازی از پروژه‌های متن‌باز محسن نیک‌سیرت."
      : "Short engineering field notes and implementation benchmarks by Mohsen Niksirat.",
    canonicalPath: fa ? "/fa/notes/" : "/notes/",
    altLangPath: fa ? "/notes/" : "/fa/notes/",
    activeNav: "notes",
    bodyHtml,
  });
}

function buildProjectsPage(locale) {
  const fa = locale === "fa";
  const prefix = fa ? `${BASE}/fa` : BASE;
  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <h1 class="page-title">${fa ? "گالری گرافیکی سیستم‌ها و پروژه‌های متن‌باز" : "Shipped Open-Source Systems Gallery"}</h1>
        <p class="page-sub">${
          fa
            ? "پیش‌نمایش تصویری واقعی ۱۲ پروژه شاخص؛ برای مشاهده تمام جزئیات روی تصاویر کلیک کنید یا مستقیماً نسخه زنده را باز کنید."
            : "Visual directory of deployed applications, AI gateways, games, and developer tools documented across this publication."
        }</p>
      </header>

      <div class="systems-showcase-grid">
        ${PROJECTS.map(
          (p) => `<article class="system-tile">
            <div class="system-shot">
              <img src="${p.shot}" alt="${esc(p.name)}" width="800" height="500" loading="lazy" decoding="async">
              <button type="button" class="shot-zoom-btn" data-lightbox-src="${p.shot}" data-lightbox-alt="${esc(p.name)}" aria-label="${fa ? `بزرگنمایی ${p.name}` : `Expand ${p.name}`}">${ICONS.zoom}</button>
            </div>
            <div class="system-tile-body">
              <div class="system-tile-head">
                <h2>${esc(p.name)}</h2>
                <span class="project-stack ltr">${esc(p.stack)}</span>
              </div>
              <p>${esc(fa ? p.descFa : p.desc)}</p>
              <div class="btn-row">
                ${
                  p.live
                    ? `<a class="btn-primary btn-sm" href="${esc(p.live)}" target="_blank" rel="noopener noreferrer">${fa ? "اجرای زنده" : "Live App"}</a>`
                    : ""
                }
                ${
                  p.essaySlug
                    ? `<a class="btn-secondary btn-sm" href="${prefix}/posts/${p.essaySlug}/">${fa ? "مقاله فنی" : "Essay"}</a>`
                    : ""
                }
                <a class="btn-secondary btn-sm" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">${fa ? "سورس گیت‌هاب" : "Source"}</a>
              </div>
            </div>
          </article>`
        ).join("")}
      </div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "گالری پروژه‌ها" : "Shipped Systems",
    description: fa
      ? "فهرست مصور اپلیکیشن‌ها، درگاه‌های هوش مصنوعی و ابزارهای متن‌باز ساخته‌شده توسط محسن نیک‌سیرت."
      : "Visual showcase of open-source web apps, AI gateways, learning tools, and games built by Mohsen Niksirat.",
    canonicalPath: fa ? "/fa/projects/" : "/projects/",
    altLangPath: fa ? "/projects/" : "/fa/projects/",
    activeNav: "projects",
    bodyHtml,
  });
}

function buildArchivePage(posts, locale) {
  const fa = locale === "fa";
  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <h1 class="page-title">${fa ? "آرشیو کامل مقالات و خوراک‌ها" : "Complete Monograph Archive"}</h1>
        <p class="page-sub">${
          fa
            ? "فهرست زمانی تمام مقالات منتشرشده به‌همراه دسترسی مستقیم به خوراک RSS برای خبرخوان‌ها."
            : "Chronological index of every published essay. Subscribe via RSS in NetNewsWire, Feedly, or Readwise Reader."
        }</p>
      </header>

      <div class="btn-row" style="margin-bottom:28px;">
        <a class="btn-secondary" href="${fa ? `${BASE}/fa/feed.xml` : `${BASE}/feed.xml`}">${ICONS.rss}<span>${fa ? "اشتراک در خوراک RSS فارسی" : "Subscribe via RSS 2.0"}</span></a>
        <a class="btn-secondary" href="${fa ? `${BASE}/fa/search/` : `${BASE}/search/`}">${ICONS.search}<span>${fa ? "جستجوی تمام‌متن" : "Full-Text Search"}</span></a>
      </div>

      <ul class="archive-list">
        ${posts
          .map(
            (p) => `<li class="archive-row">
              <a class="archive-thumb" href="${p.url}">
                <img src="${p.visual.src}" alt="" width="200" height="125" loading="lazy">
              </a>
              <div class="archive-main">
                <div class="archive-meta tabular">
                  <span class="topic-label">${esc(p.topic)}</span>
                  <span class="meta-dot" aria-hidden="true">·</span>
                  <time datetime="${p.date}">${esc(p.dateLabel)}</time>
                  <span class="meta-dot" aria-hidden="true">·</span>
                  <span>${esc(p.readTime)}</span>
                </div>
                <h2><a href="${p.url}">${esc(p.title)}</a></h2>
                <p>${esc(p.summary)}</p>
              </div>
            </li>`
          )
          .join("")}
      </ul>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "آرشیو مقالات" : "Archive",
    description: fa ? "آرشیو زمانی تمام مقالات مهندسی محسن نیک‌سیرت." : "Chronological archive of all technical essays by Mohsen Niksirat.",
    canonicalPath: fa ? "/fa/archive/" : "/archive/",
    altLangPath: fa ? "/archive/" : "/fa/archive/",
    activeNav: "archive",
    bodyHtml,
  });
}

function buildAboutPage(locale) {
  const fa = locale === "fa";
  const resumeHref = fa
    ? `${BASE}/assets/files/mohsen-niksirat-resume-fa.pdf`
    : `${BASE}/assets/files/mohsen-niksirat-resume.pdf`;

  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <div class="author-strip" style="margin-bottom:20px;">
          <img class="author-avatar" src="${BASE}/assets/shots/avatar.webp" alt="${fa ? "پرتره محسن نیک‌سیرت" : "Portrait of Mohsen Niksirat"}" width="64" height="64" style="width:64px;height:64px;">
          <div class="author-meta">
            <strong class="author-name" style="font-size:1.1rem;">${fa ? "محسن نیک‌سیرت" : "Mohsen Niksirat"}</strong>
            <span class="author-role">${fa ? "کارشناسی ارشد معماری کامپیوتر · تبریز" : "M.Sc. Computer Architecture · Tabriz"}</span>
          </div>
        </div>
        <h1 class="page-title">${fa ? "درباره من و این نشریه مهندسی" : "About Mohsen Niksirat"}</h1>
        <p class="page-sub">${
          fa
            ? "مهندس نرم‌افزار، کارشناس ارشد معماری سیستم‌های کامپیوتری و سازنده محصولات متن‌باز در حوزه هوش مصنوعی و وب محلی."
            : "Software engineer, M.Sc. in Computer Architecture, and open-source builder focused on resilient AI infrastructure, cognitive learning systems, and local-first software."
        }</p>
      </header>

      <div class="about-grid">
        <div class="prose">
          ${
            fa
              ? `<p>من محسن نیک‌سیرت هستم؛ مهندس نرم‌افزار ساکن تبریز با پیش‌زمینه آکادمیک <strong>کارشناسی ارشد معماری کامپیوتر</strong>. علاقه اصلی من ساخت ابزارهایی است که هم از نظر مهندسی سیستم دقیق و کم‌اصطکاک باشند و هم در عمل گره واقعی روزمره توسعه‌دهندگان و یادگیرندگان را باز کنند.</p>
                 <h2>چرا این نشریه را می‌نویسم؟</h2>
                 <p>در طول ساخت بیش از ۴۷ مخزن متن‌باز در گیت‌هاب (از درگاه‌های توزیع بار مدل‌های زبانی مثل <strong>9router</strong> و <strong>AIDahl</strong> تا پلتفرم یادگیری واژگان <strong>Readner</strong>، ابزار <strong>Repodest</strong> و بازی سه‌بعدی تحت وب <strong>Horde Survival 3D</strong>)، بارها با مسائل جذابی روبه‌رو شده‌ام که پاسخ آماده‌ای در مستندات رسمی نداشتند. این نشریه جایی برای مستندسازی شفاف همان تصمیم‌های معماری، دیاگرام‌های تعاملی و الگوهای کد است.</p>
                 <h2>اصول مهندسی که به آن‌ها پایبندم</h2>
                 <ul>
                   <li><strong>اولویت با پردازش محلی و حریم خصوصی:</strong> هر کاری که بتوان درون مرورگر یا دستگاه کاربر با WebCrypto، IndexedDB و WebAssembly انجام داد نباید به سرور واسط وابسته شود.</li>
                   <li><strong>پایداری در برابر خطای سرویس‌های بیرونی:</strong> در سیستم‌های هوش مصنوعی، محدودیت نرخ و قطعی سرویس‌دهنده‌ها یک استثنا نیست؛ بخشی از طراحی عادی مسیر اجرا است.</li>
                   <li><strong>تایپوگرافی و تجربه دوزبانه اصیل:</strong> نرم‌افزار و محتوای فنی فارسی سزاوار همان دقت تایپوگرافی، دسترس‌پذیری صفحه‌کلید و سرعت بارگذاری است که در بهترین نشریات مهندسی دنیا می‌بینیم.</li>
                 </ul>`
              : `<p>I am Mohsen Niksirat, a software engineer based in Tabriz holding an <strong>M.Sc. in Computer Architecture</strong>. My work sits at the intersection of practical web engineering, multi-provider AI infrastructure, interactive educational software, and cross-engine systems programming.</p>
                 <h2>Why This Publication Exists</h2>
                 <p>Across shipping 47+ public repositories on GitHub (ranging from AI gateways like <strong>9router</strong> and <strong>AIDahl</strong> to the FSRS-powered <strong>Readner</strong> suite, <strong>Repodest</strong>, <strong>MCP Studio</strong>, and the WebAssembly roguelite <strong>Horde Survival 3D</strong>), the most valuable engineering lessons always lived in the edge cases: rate-limit storms, browser memory ceilings, offline ACID storage, and bidirectional RTL typography. This publication documents those architectural trade-offs with real code, interactive sandboxes, and zero filler.</p>
                 <h2>Engineering Principles</h2>
                 <ul>
                   <li><strong>Local-first by default:</strong> Whenever a developer utility or data workbench can execute inside browser memory with zero uploads, eliminating the backend makes the tool faster, cheaper, and inherently private.</li>
                   <li><strong>Design for upstream failure:</strong> AI gateways and bot runtimes should treat provider rate limits and timeouts as routine control flow, never fatal exceptions.</li>
                   <li><strong>Bilingual craft:</strong> Every essay here is authored natively in both English and Persian RTL with self-hosted optical-size typography and verified WCAG AA contrast.</li>
                 </ul>`
          }

          <div class="btn-row" style="margin-top:28px;">
            <a class="btn-primary" href="https://mohsen-niksirat.github.io/Profile/${fa ? "fa/" : ""}" target="_blank" rel="noopener noreferrer">${fa ? "ورود به پورتفولیوی تعاملی macOS" : "Launch Interactive macOS Portfolio"}</a>
            <a class="btn-secondary" href="${resumeHref}" target="_blank" rel="noopener noreferrer">${fa ? "دریافت رزومه PDF" : "Download PDF Resume"}</a>
          </div>
        </div>

        <aside class="rail-box">
          <p class="rail-heading">${fa ? "مشخصات و راه‌های ارتباطی" : "Colophon & Channels"}</p>
          <ul class="spec-list">
            <li>
              <span class="spec-label">${fa ? "تحصیلات" : "Background"}</span>
              <span class="spec-val">${fa ? "کارشناسی ارشد معماری کامپیوتر" : "M.Sc. Computer Architecture"}</span>
            </li>
            <li>
              <span class="spec-label">${fa ? "موقعیت" : "Location"}</span>
              <span class="spec-val">${fa ? "تبریز" : "Tabriz"}</span>
            </li>
            <li>
              <span class="spec-label">${fa ? "پشته‌های اصلی" : "Core Stack"}</span>
              <span class="spec-val ltr">TypeScript · React · Python · Rust · Kotlin · Godot 4</span>
            </li>
            <li>
              <span class="spec-label">GitHub</span>
              <a class="spec-val ltr" href="https://github.com/mohsen-niksirat" target="_blank" rel="noopener noreferrer">github.com/mohsen-niksirat</a>
            </li>
            <li>
              <span class="spec-label">Telegram</span>
              <a class="spec-val ltr" href="https://t.me/mohsenniksirat" target="_blank" rel="noopener noreferrer">t.me/mohsenniksirat</a>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "درباره من" : "About",
    description: fa
      ? "درباره محسن نیک‌سیرت، کارشناس ارشد معماری کامپیوتر و مهندس نرم‌افزار."
      : "About Mohsen Niksirat, M.Sc. Computer Architecture and open-source software engineer.",
    canonicalPath: fa ? "/fa/about/" : "/about/",
    altLangPath: fa ? "/about/" : "/fa/about/",
    activeNav: "about",
    bodyHtml,
  });
}

function buildSearchPage(locale) {
  const fa = locale === "fa";
  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <h1 class="page-title">${fa ? "جستجو در مقالات و یادداشت‌ها" : "Search Monographs & Notes"}</h1>
        <p class="page-sub">${
          fa
            ? "جستجوی آنی در متن کامل مقالات انگلیسی و فارسی، تگ‌های تخصصی و یادداشت‌های آزمایشگاهی."
            : "Instant client-side full-text search across every English and Persian monograph, architectural tag, and field note."
        }</p>
      </header>

      <div class="search-field-wrap">
        <label class="search-label" for="page-search-input">${fa ? "عبارت یا کلیدواژه فنی" : "Filter by keyword, project, or protocol"}</label>
        <input class="search-input" id="page-search-input" type="search" autocomplete="off" placeholder="${
          fa ? "مثلاً: FSRS، 9router، WebAssembly، IndexedDB، MCP..." : "Try: 429 failover, FSRS, IndexedDB, Godot, MCP, PBKDF2..."
        }">
      </div>

      <div id="page-search-results"></div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "جستجو" : "Search",
    description: fa ? "جستجوی تمام‌متن در مقالات مهندسی محسن نیک‌سیرت." : "Search all engineering essays and field notes by Mohsen Niksirat.",
    canonicalPath: fa ? "/fa/search/" : "/search/",
    altLangPath: fa ? "/search/" : "/fa/search/",
    activeNav: "",
    bodyHtml,
  });
}

function buildRss(posts, locale) {
  const fa = locale === "fa";
  const feedPath = fa ? "/fa/feed.xml" : "/feed.xml";
  const siteLink = `${FULL_URL}${fa ? "/fa/" : "/"}`;
  const title = fa ? "نشریه مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Publication";
  const desc = fa
    ? "مقالات مهندسی نرم‌افزار، درگاه‌های هوش مصنوعی و معماری وب محلی"
    : "Visual engineering essays on AI gateways, spaced repetition, WebAssembly, and local-first tools.";

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${FULL_URL}${p.canonicalPath}</link>
      <guid isPermaLink="true">${FULL_URL}${p.canonicalPath}</guid>
      <pubDate>${new Date(`${p.date}T09:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(p.topic)}</category>
      <description>${esc(p.summary)}</description>
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(title)}</title>
    <description>${esc(desc)}</description>
    <link>${siteLink}</link>
    <language>${fa ? "fa-ir" : "en-us"}</language>
    <atom:link href="${FULL_URL}${feedPath}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function buildRedirectStub(targetUrl, title = "Redirecting...") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=${esc(targetUrl)}">
  <link rel="canonical" href="${esc(targetUrl)}">
  <title>${esc(title)}</title>
</head>
<body>
  <p>Moved to <a href="${esc(targetUrl)}">${esc(targetUrl)}</a>.</p>
</body>
</html>`;
}

// ─── Execute Full Build ──────────────────────────────────────────────────────

const enPosts = loadPosts("en");
const faPosts = loadPosts("fa");

writeOut("index.html", buildHomePage(enPosts, "en"));
writeOut("fa/index.html", buildHomePage(faPosts, "fa"));

enPosts.forEach((p, idx) => writeOut(`posts/${p.slug}/index.html`, buildPostPage(p, idx, enPosts)));
faPosts.forEach((p, idx) => writeOut(`fa/posts/${p.slug}/index.html`, buildPostPage(p, idx, faPosts)));

writeOut("notes/index.html", buildNotesPage("en"));
writeOut("fa/notes/index.html", buildNotesPage("fa"));
writeOut("projects/index.html", buildProjectsPage("en"));
writeOut("fa/projects/index.html", buildProjectsPage("fa"));
writeOut("archive/index.html", buildArchivePage(enPosts, "en"));
writeOut("fa/archive/index.html", buildArchivePage(faPosts, "fa"));
writeOut("about/index.html", buildAboutPage("en"));
writeOut("fa/about/index.html", buildAboutPage("fa"));
writeOut("search/index.html", buildSearchPage("en"));
writeOut("fa/search/index.html", buildSearchPage("fa"));

writeOut("2024/06/10/welcome-to-my-blog/index.html", buildRedirectStub(`${FULL_URL}/`, "Mohsen Niksirat Engineering Publication"));
writeOut("2024/06/12/building-my-blog/index.html", buildRedirectStub(`${FULL_URL}/`, "Mohsen Niksirat Engineering Publication"));

writeOut(
  "404.html",
  renderShell({
    locale: "en",
    title: "Page Not Found",
    description: "The requested page could not be found in Mohsen Niksirat's Engineering Publication.",
    canonicalPath: "/404.html",
    altLangPath: "/fa/",
    bodyHtml: `<section class="page-section">
      <header class="page-header">
        <h1 class="page-title">404: Page Not Found</h1>
        <p class="page-sub">The URL you followed may have moved. Use the links below or press <code>⌘K</code> to search every monograph.</p>
      </header>
      <div class="btn-row">
        <a class="btn-primary" href="${BASE}/">Back to English Edition</a>
        <a class="btn-secondary" href="${BASE}/fa/">ورود به نسخه فارسی</a>
      </div>
    </section>`,
  })
);

const searchIndex = [
  ...enPosts.map((p) => ({
    lang: "en",
    title: p.title,
    summary: p.summary,
    topic: p.topic,
    tags: p.tags,
    dateLabel: p.dateLabel,
    readTime: p.readTime,
    url: p.url,
    body: p.bodyRaw.slice(0, 2400),
  })),
  ...faPosts.map((p) => ({
    lang: "fa",
    title: p.title,
    summary: p.summary,
    topic: p.topic,
    tags: p.tags,
    dateLabel: p.dateLabel,
    readTime: p.readTime,
    url: p.url,
    body: p.bodyRaw.slice(0, 2400),
  })),
  ...notesRaw.map((n) => ({
    lang: "en",
    title: n.title,
    summary: n.body,
    topic: `Field Note · ${n.tag}`,
    tags: [n.tag, n.linkLabel],
    dateLabel: formatDate(n.date, "en"),
    readTime: "Lab Note",
    url: `${BASE}/notes/#${n.id}`,
    body: n.body,
  })),
  ...notesRaw.map((n) => ({
    lang: "fa",
    title: n.titleFa,
    summary: n.bodyFa,
    topic: `یادداشت فنی · ${n.tagFa}`,
    tags: [n.tagFa, n.linkLabel],
    dateLabel: formatDate(n.date, "fa"),
    readTime: "یادداشت کوتاه",
    url: `${BASE}/fa/notes/#${n.id}`,
    body: n.bodyFa,
  })),
];
writeOut("search-index.json", JSON.stringify(searchIndex, null, 2));

writeOut("feed.xml", buildRss(enPosts, "en"));
writeOut("fa/feed.xml", buildRss(faPosts, "fa"));

const sitemapPaths = [
  "/",
  "/fa/",
  "/notes/",
  "/fa/notes/",
  "/projects/",
  "/fa/projects/",
  "/archive/",
  "/fa/archive/",
  "/about/",
  "/fa/about/",
  "/search/",
  "/fa/search/",
  ...enPosts.map((p) => p.canonicalPath),
  ...faPosts.map((p) => p.canonicalPath),
];

const todayIso = new Date().toISOString().slice(0, 10);
writeOut(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((u) => `  <url><loc>${FULL_URL}${u}</loc><lastmod>${todayIso}</lastmod></url>`).join("\n")}
</urlset>
`
);

writeOut(
  "robots.txt",
  `User-agent: *
Allow: /

Sitemap: ${FULL_URL}/sitemap.xml
`
);

writeOut(
  "manifest.webmanifest",
  JSON.stringify(
    {
      name: "Mohsen Niksirat · Engineering Publication",
      short_name: "Mohsen Blog",
      description: "Visual bilingual engineering essays and lab notes by Mohsen Niksirat.",
      start_url: `${BASE}/`,
      scope: `${BASE}/`,
      display: "standalone",
      background_color: "#0B0E14",
      theme_color: "#0B0E14",
      icons: [
        { src: `${BASE}/assets/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${BASE}/assets/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  )
);

console.log(`✓ Built graphical publication: ${enPosts.length} EN + ${faPosts.length} FA essays, ${PROJECTS.length} visual systems, ${notesRaw.length} notes, RSS, search (${searchIndex.length}), sitemap (${sitemapPaths.length}).`);

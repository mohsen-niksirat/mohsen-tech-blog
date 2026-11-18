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
  // Split by inline code first so code spans are never mangled
  return text
    .split(/(`[^`]+`)/g)
    .map((part) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return `<code>${esc(part.slice(1, -1))}</code>`;
      }
      let s = esc(part);
      // Links [label](href)
      s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        const external = /^https?:\/\//.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
        return `<a href="${href}"${attrs}>${label}</a>`;
      });
      // Bold & italic
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

// ─── SVG Icons (1.75px stroke, zero emoji controls) ──────────────────────────

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  theme: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  rss: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
};

// ─── Curated Real Projects Data ──────────────────────────────────────────────

const PROJECTS = [
  {
    name: "Repodest",
    stack: "JavaScript · GitHub REST API · Chrome MV3",
    desc: "Client-side GitHub repository health analyzer and token-aware Markdown prompt packer for ChatGPT, Claude, and Gemini.",
    descFa: "تحلیلگر کاملاً سمت کاربر برای مخزن‌های گیت‌هاب همراه با محاسبه امتیاز سلامت و بسته‌بندی فایل‌ها برای مدل‌های زبانی.",
    live: "https://mohsen-niksirat.github.io/Repodest/",
    repo: "https://github.com/mohsen-niksirat/Repodest",
  },
  {
    name: "Readner · Leitner Pro Max",
    stack: "PWA · IndexedDB · FSRS · Kotlin Android",
    desc: "Offline-first vocabulary suite combining FSRS spaced repetition, an integrated PDF reader, WordWeb semantic graphs, and 4,500+ CEFR words.",
    descFa: "مجموعه یادگیری واژگان آفلاین مجهز به زمان‌بند علمی FSRS، خواننده PDF، شبکه معنایی WordWeb و ۴٬۵۰۰ لغت سطح‌بندی‌شده CEFR.",
    live: "https://mohsen-niksirat.github.io/Leitner-Pro-Max/",
    repo: "https://github.com/mohsen-niksirat/Leitner-Pro-Max",
  },
  {
    name: "9router AI Gateway",
    stack: "JavaScript · Serverless · Telegram Mini App",
    desc: "Multi-provider AI gateway pooling Gemini, Groq, DeepSeek, OpenAI, and OpenRouter keys with automatic HTTP 429 failover and AES-GCM vaults.",
    descFa: "درگاه چندسرویس‌دهنده هوش مصنوعی و مینی‌اپ تلگرام با توزیع بار کلیدها، جایگزینی خودکار روی خطای ۴۲۹ و رمزنگاری اختصاصی.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/9router_TG_Bot",
  },
  {
    name: "AIDahl",
    stack: "Python · OpenRouter · Supabase · Telegram",
    desc: "Bring-Your-Own-Key Telegram AI assistant featuring live coalesced SSE streaming, named threads, and Manus research/image workflows.",
    descFa: "دستیار هوش مصنوعی تلگرام با معماری BYOK، استریم زنده پیام‌ها، گفتگوهای نام‌گذاری‌شده و ابزارهای تولید تصویر و پژوهش.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/AIDahl",
  },
  {
    name: "Horde Survival 3D",
    stack: "Godot 4 · GDScript · WebAssembly / WebGL",
    desc: "Browser-playable 3D survival roguelite running at 60 FPS with spatial-hash swarm combat, evolving weapons, and a three-phase boss.",
    descFa: "بازی بقای روگ‌لایت سه‌بعدی با خروجی WebAssembly در مرورگر، برخورد مکانی بهینه، ارتقای سلاح‌ها و مبارزه با باس سه‌فازی.",
    live: "https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/",
    repo: "https://github.com/mohsen-niksirat/Horde_Survival_3D_Godot",
  },
  {
    name: "MCP Studio",
    stack: "TypeScript · JSON-RPC 2.0 · JSON Schema",
    desc: "Visual browser workbench for inspecting Model Context Protocol tool schemas, testing invocations, and tracing JSON-RPC payloads.",
    descFa: "استودیوی گرافیکی تست و بازرسی سرورهای استاندارد MCP، فرم‌ساز خودکار از اسکیمای ابزارها و ردیاب پیام‌های JSON-RPC.",
    live: "https://mohsen-niksirat.github.io/Mcp-Studio/",
    repo: "https://github.com/mohsen-niksirat/Mcp-Studio",
  },
  {
    name: "CodeVis",
    stack: "HTML5 Canvas · Zero Dependencies · Single File",
    desc: "49 computer science algorithms and patterns animated step-by-step with bidirectional timeline scrubbing and synced code pointers.",
    descFa: "آموزش تعاملی ۴۹ مفهوم علوم کامپیوتر روی بوم Canvas با قابلیت حرکت دوطرفه بین گام‌ها و هایلایت همگام کد.",
    live: "https://mohsen-niksirat.github.io/CodeVis/",
    repo: "https://github.com/mohsen-niksirat/CodeVis",
  },
  {
    name: "DataLens",
    stack: "JavaScript · SVG Charts · Offline PWA",
    desc: "Zero-upload in-browser data workbench supporting CSV, JSON, YAML, XML, SQL, and Excel inspection and conversion.",
    descFa: "میزکار تحلیل، آمارگیری و تبدیل فایل‌های داده در ۶ فرمت مختلف کاملاً آفلاین و بدون ارسال فایل به سرور.",
    live: "https://mohsen-niksirat.github.io/DataLens/",
    repo: "https://github.com/mohsen-niksirat/DataLens",
  },
  {
    name: "SpeakAI Coach",
    stack: "TypeScript · Voice AI · PWA",
    desc: "Real-time spoken English conversation tutor with 8 personas, turn-by-turn grammar feedback, and 6-axis IELTS Speaking band estimation.",
    descFa: "مربی هوشمند مکالمه صوتی انگلیسی همراه با ۸ نقش گفتگو، اصلاح لحظه‌ای گرامر و تخمین شش‌محوری نمره اسپیکینگ آیلتس.",
    live: "https://mohsen-niksirat.github.io/SpeakAI-Coach/",
    repo: "https://github.com/mohsen-niksirat/SpeakAI-Coach",
  },
  {
    name: "A11y Inspector",
    stack: "JavaScript · WCAG 2.2 · PWA + Node CLI",
    desc: "Privacy-first HTML accessibility auditor checking contrast ratios, landmarks, headings, and ARIA rules in-browser and in CI.",
    descFa: "ابزار ممیزی دسترس‌پذیری وب بر اساس استاندارد WCAG 2.2 در مرورگر به‌همراه نسخه خط فرمان برای بررسی خودکار در CI.",
    live: "https://mohsen-niksirat.github.io/A11y-Inspector/",
    repo: "https://github.com/mohsen-niksirat/A11y-Inspector",
  },
  {
    name: "Kite Downloader",
    stack: "Rust · Tauri v2 · Tokio Async",
    desc: "Lightweight native Windows download manager under 8 MB featuring segmented range downloads and clipboard sniffing.",
    descFa: "مدیریت دانلود سبک و سریع دسکتاپ با Rust و Tauri v2 با حجم زیر ۸ مگابایت و دانلود چندبخشی فایل‌ها.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/kite-downloader",
  },
  {
    name: "Interactive macOS & iOS Portfolio",
    stack: "React 19 · Vite · Tailwind 4 · GSAP",
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
        { key: "projects", label: "پروژه‌ها", href: `${prefix}/projects/` },
        { key: "archive", label: "آرشیو", href: `${prefix}/archive/` },
        { key: "about", label: "درباره من", href: `${prefix}/about/` },
      ]
    : [
        { key: "home", label: "Essays", href: `${prefix}/` },
        { key: "notes", label: "Field Notes", href: `${prefix}/notes/` },
        { key: "projects", label: "Projects", href: `${prefix}/projects/` },
        { key: "archive", label: "Archive", href: `${prefix}/archive/` },
        { key: "about", label: "About", href: `${prefix}/about/` },
      ];

  const siteName = fa ? "یادداشت‌های مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Monograph";
  const fullTitle = title === siteName ? siteName : `${title} | ${siteName}`;

  return `<!DOCTYPE html>
<html lang="${fa ? "fa" : "en"}" dir="${fa ? "rtl" : "ltr"}">
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
    (function(){try{var t=localStorage.getItem("mtb-theme");if(t==="dark"||(!t&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.setAttribute("data-theme","dark");}var s=localStorage.getItem("mtb-font-size");if(s&&s!=="md"){document.documentElement.setAttribute("data-font-size",s);}}catch(_){}})();
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
          <span class="brand-sub">${fa ? "دفترچه مهندسی نرم‌افزار و هوش مصنوعی" : "Engineering Monograph & Lab Notes"}</span>
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

    return {
      ...meta,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      locale,
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

  const bodyHtml = `
    <section class="masthead-intro">
      <div class="masthead-grid">
        <div>
          <h1 class="masthead-title">${
            fa
              ? "یادداشت‌های معماری نرم‌افزار، درگاه‌های هوش مصنوعی و ابزارهای وب محلی"
              : "Systems notes on resilient AI gateways, cognitive learning tools, and local-first web craft"
          }</h1>
        </div>
        <div>
          <p class="masthead-lede">${
            fa
              ? "اینجا دفترچه فنی من است: کالبدشکافی تصمیم‌های واقعی مهندسی، الگوریتم‌ها و ساختار کدهایی که در بیش از ۴۷ مخزن متن‌باز، وب‌اپ‌های آفلاین و ابزارهای هوش مصنوعی ساخته‌ام."
              : "Long-form engineering essays and lab dispatches distilled from building 47+ open-source repositories across serverless AI routing, spaced-repetition engines, WebAssembly games, and zero-backend developer tools."
          }</p>
        </div>
      </div>

      <div class="colophon-bar">
        <span class="tabular">${
          fa
            ? `${toFaDigits(posts.length)} مقاله تحلیلی · ${toFaDigits(notesRaw.length)} یادداشت آزمایشگاهی · دوزبانه (فارسی و انگلیسی)`
            : `${posts.length} Deep-Dive Monographs · ${notesRaw.length} Lab Field Notes · Bilingual Edition (EN / FA)`
        }</span>
        <div class="colophon-links">
          <a href="https://mohsen-niksirat.github.io/Profile/${fa ? "fa/" : ""}" target="_blank" rel="noopener noreferrer">${fa ? "مشاهده دسکتاپ تعاملی من" : "Open Interactive macOS Portfolio"}</a>
          <a href="https://github.com/mohsen-niksirat" target="_blank" rel="noopener noreferrer">@mohsen-niksirat</a>
          <a href="${fa ? `${BASE}/fa/feed.xml` : `${BASE}/feed.xml`}">${fa ? "خوراک RSS" : "RSS Feed"}</a>
        </div>
      </div>
    </section>

    <section class="lead-spread" aria-labelledby="lead-essay-heading">
      <div class="lead-grid">
        <div>
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
            <a class="btn-primary" href="${lead.url}">${fa ? "مطالعه مقاله کامل" : "Read Full Monograph"}</a>
            <a class="btn-secondary" href="${lead.projectRepo}" target="_blank" rel="noopener noreferrer">${fa ? "مخزن کد در گیت‌هاب" : "Inspect Source on GitHub"}</a>
          </div>
        </div>
        <div class="lead-visual">
          ${DIAGRAMS[lead.diagram] ? DIAGRAMS[lead.diagram](locale) : ""}
        </div>
      </div>
    </section>

    <section class="ledger-section" aria-labelledby="ledger-heading">
      <div class="section-head">
        <h2 id="ledger-heading" class="section-title">${fa ? "فهرست مقالات مهندسی" : "Published Monographs"}</h2>
        <a href="${prefix}/archive/">${fa ? "مشاهده آرشیو کامل" : "Browse complete archive"}</a>
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

      <ul class="essay-ledger">
        ${posts
          .map(
            (p) => `<li class="ledger-row" data-essay-topic="${esc(p.topic)}">
              <div class="ledger-date tabular">
                <time datetime="${p.date}">${esc(p.dateLabel)}</time>
                <span class="ledger-readtime">${esc(p.readTime)}</span>
              </div>
              <div class="ledger-main">
                <h3><a href="${p.url}">${esc(p.title)}</a></h3>
                <p>${esc(p.summary)}</p>
              </div>
              <div class="ledger-topic">${esc(p.topic)}</div>
            </li>`
          )
          .join("")}
      </ul>

      <div class="empty-state" id="ledger-empty" hidden>
        <p>${fa ? "هیچ مقاله‌ای در این دسته‌بندی یافت نشد." : "No essays match the selected topic."}</p>
        <button type="button" class="btn-secondary" data-reset-filter>${fa ? "نمایش همه مقالات" : "Show all essays"}</button>
      </div>
    </section>

    <section class="notes-section" aria-labelledby="notes-heading">
      <div class="section-head">
        <h2 id="notes-heading" class="section-title">${fa ? "یادداشت‌های کوتاه آزمایشگاهی" : "Recent Lab Field Notes"}</h2>
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
    title: fa ? "یادداشت‌های مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Monograph",
    description: fa
      ? "مقالات عمیق مهندسی نرم‌افزار، سیستم‌های هوش مصنوعی، الگوریتم FSRS، WebAssembly و ابزارهای وب محلی نوشته محسن نیک‌سیرت."
      : "Technical essays and field notes by Mohsen Niksirat on multi-provider AI gateways, FSRS spaced repetition, Godot 4 WebAssembly, MCP tooling, and local-first web architecture.",
    canonicalPath: fa ? "/fa/" : "/",
    altLangPath: fa ? "/" : "/fa/",
    activeNav: "home",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: fa ? "یادداشت‌های مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Monograph",
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

          <nav class="post-Matrix-nav" aria-label="${fa ? "مقاله قبلی و بعدی" : "Adjacent monographs"}">
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
  const bodyHtml = `
    <section class="page-section">
      <header class="page-header">
        <h1 class="page-title">${fa ? "فهرست سیستم‌ها و پروژه‌های متن‌باز" : "Shipped Open-Source Systems"}</h1>
        <p class="page-sub">${
          fa
            ? "گزیده‌ای از پروژه‌هایی که مقالات این وبلاگ بر پایه معماری واقعی آن‌ها نوشته شده‌اند. برای تجربه نمای کامل دسکتاپ به پورتفولیوی تعاملی سر بزنید."
            : "Every essay in this journal comes from real shipped software. Launch any live web build below or explore full case studies inside my interactive OS portfolio."
        }</p>
      </header>

      <div class="project-directory">
        ${PROJECTS.map(
          (p) => `<article class="project-row">
            <div>
              <h2>${esc(p.name)}</h2>
              <span class="project-stack ltr">${esc(p.stack)}</span>
            </div>
            <p class="project-desc">${esc(fa ? p.descFa : p.desc)}</p>
            <div class="project-links">
              ${
                p.live
                  ? `<a class="btn-primary" href="${esc(p.live)}" target="_blank" rel="noopener noreferrer">${fa ? "اجرای زنده" : "Live App"}</a>`
                  : ""
              }
              <a class="btn-secondary" href="${esc(p.repo)}" target="_blank" rel="noopener noreferrer">${fa ? "سورس گیت‌هاب" : "Source"}</a>
            </div>
          </article>`
        ).join("")}
      </div>
    </section>
  `;

  return renderShell({
    locale,
    title: fa ? "پروژه‌های متن‌باز" : "Projects",
    description: fa
      ? "فهرست اپلیکیشن‌ها، درگاه‌های هوش مصنوعی و ابزارهای متن‌باز ساخته‌شده توسط محسن نیک‌سیرت."
      : "Open-source web apps, AI gateways, learning tools, and games built by Mohsen Niksirat.",
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

      <ul class="essay-ledger">
        ${posts
          .map(
            (p) => `<li class="ledger-row">
              <div class="ledger-date tabular">
                <time datetime="${p.date}">${esc(p.dateLabel)}</time>
                <span class="ledger-readtime">${esc(p.readTime)}</span>
              </div>
              <div class="ledger-main">
                <h2 style="font-family:var(--font-serif);font-size:1.3rem;font-weight:600;margin-bottom:6px;"><a href="${p.url}" style="color:var(--text-primary);text-decoration:none;">${esc(p.title)}</a></h2>
                <p>${esc(p.summary)}</p>
              </div>
              <div class="ledger-topic">${esc(p.topic)}</div>
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
        <h1 class="page-title">${fa ? "درباره محسن نیک‌سیرت" : "About Mohsen Niksirat"}</h1>
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
                 <h2>چرا این وبلاگ را می‌نویسم؟</h2>
                 <p>در طول ساخت بیش از ۴۷ مخزن متن‌باز در گیت‌هاب (از درگاه‌های توزیع بار مدل‌های زبانی مثل <strong>9router</strong> و <strong>AIDahl</strong> تا پلتفرم یادگیری واژگان <strong>Readner</strong>، ابزار <strong>Repodest</strong> و بازی سه‌بعدی تحت وب <strong>Horde Survival 3D</strong>)، بارها با مسائل جذابی روبه‌رو شده‌ام که پاسخ آماده‌ای در مستندات رسمی نداشتند. این دفترچه جایی برای مستندسازی شفاف همان تصمیم‌های معماری، بنچمارک‌ها و الگوهای کد است.</p>
                 <h2>اصول مهندسی که به آن‌ها پایبندم</h2>
                 <ul>
                   <li><strong>اولویت با پردازش محلی و حریم خصوصی:</strong> هر کاری که بتوان درون مرورگر یا دستگاه کاربر با WebCrypto، IndexedDB و WebAssembly انجام داد نباید به سرور واسط وابسته شود.</li>
                   <li><strong>پایداری در برابر خطای سرویس‌های بیرونی:</strong> در سیستم‌های هوش مصنوعی، محدودیت نرخ و قطعی سرویس‌دهنده‌ها یک استثنا نیست؛ بخشی از طراحی عادی مسیر اجرا است.</li>
                   <li><strong>تایپوگرافی و تجربه دوزبانه اصیل:</strong> نرم‌افزار و محتوای فنی فارسی سزاوار همان دقت تایپوگرافی، دسترس‌پذیری صفحه‌کلید و سرعت بارگذاری است که در بهترین نشریات مهندسی دنیا می‌بینیم.</li>
                 </ul>`
              : `<p>I am Mohsen Niksirat, a software engineer based in Tabriz holding an <strong>M.Sc. in Computer Architecture</strong>. My work sits at the intersection of practical web engineering, multi-provider AI infrastructure, interactive educational software, and cross-engine systems programming.</p>
                 <h2>Why This Monograph Exists</h2>
                 <p>Across shipping 47+ public repositories on GitHub (ranging from AI gateways like <strong>9router</strong> and <strong>AIDahl</strong> to the FSRS-powered <strong>Readner</strong> suite, <strong>Repodest</strong>, <strong>MCP Studio</strong>, and the WebAssembly roguelite <strong>Horde Survival 3D</strong>), the most valuable engineering lessons always lived in the edge cases: rate-limit storms, browser memory ceilings, offline ACID storage, and bidirectional RTL typography. This publication documents those architectural trade-offs with real code and zero filler.</p>
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
  const title = fa ? "یادداشت‌های مهندسی محسن نیک‌سیرت" : "Mohsen Niksirat · Engineering Monograph";
  const desc = fa
    ? "مقالات مهندسی نرم‌افزار، درگاه‌های هوش مصنوعی و معماری وب محلی"
    : "Long-form engineering essays on AI gateways, spaced repetition, WebAssembly, and local-first tools.";

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

// Homepages
writeOut("index.html", buildHomePage(enPosts, "en"));
writeOut("fa/index.html", buildHomePage(faPosts, "fa"));

// Article pages
enPosts.forEach((p, idx) => writeOut(`posts/${p.slug}/index.html`, buildPostPage(p, idx, enPosts)));
faPosts.forEach((p, idx) => writeOut(`fa/posts/${p.slug}/index.html`, buildPostPage(p, idx, faPosts)));

// Section pages
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

// Legacy Jekyll post redirects so historical links never 404
writeOut("2024/06/10/welcome-to-my-blog/index.html", buildRedirectStub(`${FULL_URL}/`, "Mohsen Niksirat Engineering Monograph"));
writeOut("2024/06/12/building-my-blog/index.html", buildRedirectStub(`${FULL_URL}/`, "Mohsen Niksirat Engineering Monograph"));

// 404 Page
writeOut(
  "404.html",
  renderShell({
    locale: "en",
    title: "Page Not Found",
    description: "The requested page could not be found in Mohsen Niksirat's Engineering Monograph.",
    canonicalPath: "/404.html",
    altLangPath: "/fa/",
    bodyHtml: `<section class="page-section">
      <header class="page-header">
        <h1 class="page-title">404: Page Not Found</h1>
        <p class="page-sub">The URL you followed may have moved during the bilingual monograph redesign. Use the links below or press <code>⌘K</code> to search every essay.</p>
      </header>
      <div class="btn-row">
        <a class="btn-primary" href="${BASE}/">Back to English Edition</a>
        <a class="btn-secondary" href="${BASE}/fa/">ورود به نسخه فارسی</a>
      </div>
    </section>`,
  })
);

// Search Index (EN + FA essays + Field Notes)
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

// RSS Feeds
writeOut("feed.xml", buildRss(enPosts, "en"));
writeOut("fa/feed.xml", buildRss(faPosts, "fa"));

// Sitemap & Robots & Manifest
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
      name: "Mohsen Niksirat · Engineering Monograph",
      short_name: "Mohsen Blog",
      description: "Bilingual engineering essays and lab notes by Mohsen Niksirat.",
      start_url: `${BASE}/`,
      scope: `${BASE}/`,
      display: "standalone",
      background_color: "#FBF9F5",
      theme_color: "#181614",
      icons: [
        { src: `${BASE}/assets/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${BASE}/assets/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2
  )
);

console.log(`✓ Built ${enPosts.length} EN + ${faPosts.length} FA monographs, ${notesRaw.length} field notes, RSS feeds, search index (${searchIndex.length} entries), and sitemap (${sitemapPaths.length} URLs).`);

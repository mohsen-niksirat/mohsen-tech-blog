import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIAGRAMS } from "./diagrams.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

const POST_VISUALS = {
  "multi-provider-ai-gateway": {
    src: "assets/shots/9router.webp",
    alt: "9router universal multi-provider AI gateway routing across Gemini, Groq, DeepSeek, OpenAI, and OpenRouter.",
    altFa: "نمای سیستم درگاه چندسرویس‌دهنده 9router برای مدیریت و مسیریابی مدل‌های Gemini، Groq و DeepSeek.",
    year: "2026",
    sceneState: 0,
  },
  "fsrs-spaced-repetition-architecture": {
    src: "assets/shots/leitner-pro-max.webp",
    alt: "Readner Leitner Pro Max interface showing CEFR vocabulary decks alongside PDF reading workspace.",
    altFa: "محیط کاربری Readner لایتنر پرو مکس شامل بسته‌های واژگان CEFR و خواننده PDF.",
    year: "2026",
    sceneState: 1,
  },
  "godot4-wasm-horde-survival": {
    src: "assets/shots/horde-survival-3d.webp",
    alt: "Horde Survival 3D running at 60 FPS inside WebGL 2 with active swarm combat and XP pickups.",
    altFa: "گیم‌پلی ۶۰ فریم بازی سه‌بعدی Horde Survival 3D اجراشده در مرورگر با WebGL 2.",
    year: "2026",
    sceneState: 2,
  },
  "browser-only-developer-tools": {
    src: "assets/shots/repodest.webp",
    alt: "Repodest client-side GitHub repository analyzer displaying repository health score and file explorer.",
    altFa: "داشبورد تحلیلگر کاملاً محلی Repodest برای امتیاز سلامت مخزن و بسته‌بندی فایل‌های کد.",
    year: "2026",
    sceneState: 0,
  },
  "inspecting-mcp-servers-visually": {
    src: "assets/shots/mcp-studio.webp",
    alt: "MCP Studio IDE testing Model Context Protocol tool schemas and inspecting JSON-RPC responses.",
    altFa: "محیط استودیوی گرافیکی MCP Studio برای بررسی اسکیمای ابزارها و ترافیک JSON-RPC.",
    year: "2026",
    sceneState: 1,
  },
  "deterministic-canvas-cs-animations": {
    src: "assets/shots/codevis.webp",
    alt: "CodeVis interactive HTML5 Canvas visualizer stepping through 62 algorithms with synchronized code highlights.",
    altFa: "محیط آموزش بصری CodeVis با نمایش همزمان گرافیک Canvas و خط فعال کد برای ۶۲ الگوریتم.",
    year: "2026",
    sceneState: 2,
  },
};

const PROJECTS = [
  {
    id: "repodest",
    name: "Repodest",
    stack: "JavaScript · GitHub REST API · Chrome MV3",
    year: "2026",
    shot: "assets/shots/repodest.webp",
    essaySlug: "browser-only-developer-tools",
    desc: "Client-side GitHub repository health analyzer and token-aware Markdown prompt packer for ChatGPT, Claude, and Gemini.",
    descFa: "تحلیلگر کاملاً سمت کاربر برای مخزن‌های گیت‌هاب همراه با محاسبه امتیاز سلامت و بسته‌بندی فایل‌ها برای مدل‌های زبانی.",
    live: "https://mohsen-niksirat.github.io/Repodest/",
    repo: "https://github.com/mohsen-niksirat/Repodest",
  },
  {
    id: "readner",
    name: "Readner · Leitner Pro Max",
    stack: "PWA · IndexedDB · FSRS · Kotlin Android",
    year: "2026",
    shot: "assets/shots/leitner-pro-max.webp",
    essaySlug: "fsrs-spaced-repetition-architecture",
    desc: "Offline-first vocabulary suite combining FSRS spaced repetition, an integrated PDF reader, WordWeb semantic graphs, and 4,500+ CEFR words.",
    descFa: "مجموعه یادگیری واژگان آفلاین مجهز به زمان‌بند علمی FSRS، خواننده PDF، شبکه معنایی WordWeb و ۴٬۵۰۰ لغت سطح‌بندی‌شده CEFR.",
    live: "https://mohsen-niksirat.github.io/Leitner-Pro-Max/",
    repo: "https://github.com/mohsen-niksirat/Leitner-Pro-Max",
  },
  {
    id: "9router",
    name: "9router AI Gateway",
    stack: "JavaScript · Serverless · Telegram Mini App",
    year: "2026",
    shot: "assets/shots/9router.webp",
    essaySlug: "multi-provider-ai-gateway",
    desc: "Multi-provider AI gateway pooling Gemini, Groq, DeepSeek, OpenAI, and OpenRouter keys with automatic HTTP 429 failover and AES-GCM vaults.",
    descFa: "درگاه چندسرویس‌دهنده هوش مصنوعی و مینی‌اپ تلگرام با توزیع بار کلیدها، جایگزینی خودکار روی خطای ۴۲۹ و رمزنگاری اختصاصی.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/9router_TG_Bot",
  },
  {
    id: "horde-survival-3d",
    name: "Horde Survival 3D",
    stack: "Godot 4 · GDScript · WebAssembly / WebGL",
    year: "2026",
    shot: "assets/shots/horde-survival-3d.webp",
    essaySlug: "godot4-wasm-horde-survival",
    desc: "Browser-playable 3D survival roguelite running at 60 FPS with spatial-hash swarm combat, evolving weapons, and a three-phase boss.",
    descFa: "بازی بقای روگ‌لایت سه‌بعدی با خروجی WebAssembly در مرورگر، برخورد مکانی بهینه، ارتقای سلاح‌ها و مبارزه با باس سه‌فازی.",
    live: "https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/",
    repo: "https://github.com/mohsen-niksirat/Horde_Survival_3D_Godot",
  },
  {
    id: "mcp-studio",
    name: "MCP Studio",
    stack: "TypeScript · JSON-RPC 2.0 · JSON Schema",
    year: "2026",
    shot: "assets/shots/mcp-studio.webp",
    essaySlug: "inspecting-mcp-servers-visually",
    desc: "Visual browser workbench for inspecting Model Context Protocol tool schemas, testing invocations, and tracing JSON-RPC payloads.",
    descFa: "استودیوی گرافیکی تست و بازرسی سرورهای استاندارد MCP، فرم‌ساز خودکار از اسکیمای ابزارها و ردیاب پیام‌های JSON-RPC.",
    live: "https://mohsen-niksirat.github.io/Mcp-Studio/",
    repo: "https://github.com/mohsen-niksirat/Mcp-Studio",
  },
  {
    id: "codevis",
    name: "CodeVis",
    stack: "HTML5 Canvas · Zero Dependencies · Single File",
    year: "2026",
    shot: "assets/shots/codevis.webp",
    essaySlug: "deterministic-canvas-cs-animations",
    desc: "62 interactive canvas animations for computer science algorithms and patterns, stepped bidirectionally with synced code pointers.",
    descFa: "۶۲ انیمیشن تعاملی روی بوم Canvas برای آموزش گام‌به‌گام الگوریتم‌ها و مفاهیم علوم کامپیوتر با حرکت دوطرفه و هایلایت همگام کد.",
    live: "https://mohsen-niksirat.github.io/CodeVis/",
    repo: "https://github.com/mohsen-niksirat/CodeVis",
  },
  {
    id: "datalens",
    name: "DataLens",
    stack: "JavaScript · SVG Charts · Offline PWA",
    year: "2026",
    shot: "assets/shots/datalens.webp",
    essaySlug: "browser-only-developer-tools",
    desc: "Zero-upload in-browser data workbench supporting CSV, JSON, YAML, XML, SQL, and Excel inspection and conversion.",
    descFa: "میزکار تحلیل، آمارگیری و تبدیل فایل‌های داده در ۶ فرمت مختلف کاملاً آفلاین و بدون ارسال فایل به سرور.",
    live: "https://mohsen-niksirat.github.io/DataLens/",
    repo: "https://github.com/mohsen-niksirat/DataLens",
  },
  {
    id: "speakai-coach",
    name: "SpeakAI Coach",
    stack: "TypeScript · Voice AI · PWA",
    year: "2026",
    shot: "assets/shots/speakai-coach.webp",
    essaySlug: "",
    desc: "Real-time spoken English conversation tutor with 8 personas, turn-by-turn grammar feedback, and 6-axis IELTS Speaking band estimation.",
    descFa: "مربی هوشمند مکالمه صوتی انگلیسی همراه با ۸ نقش گفتگو، اصلاح لحظه‌ای گرامر و تخمین شش‌محوری نمره اسپیکینگ آیلتس.",
    live: "https://mohsen-niksirat.github.io/SpeakAI-Coach/",
    repo: "https://github.com/mohsen-niksirat/SpeakAI-Coach",
  },
  {
    id: "a11y-inspector",
    name: "A11y Inspector",
    stack: "JavaScript · WCAG 2.2 · PWA + Node CLI",
    year: "2026",
    shot: "assets/shots/a11y-inspector.webp",
    essaySlug: "browser-only-developer-tools",
    desc: "Privacy-first HTML accessibility auditor checking contrast ratios, landmarks, headings, and ARIA rules in-browser and in CI.",
    descFa: "ابزار ممیزی دسترس‌پذیری وب بر اساس استاندارد WCAG 2.2 در مرورگر به‌همراه نسخه خط فرمان برای بررسی خودکار در CI.",
    live: "https://mohsen-niksirat.github.io/A11y-Inspector/",
    repo: "https://github.com/mohsen-niksirat/A11y-Inspector",
  },
  {
    id: "aidahl",
    name: "AIDahl",
    stack: "Python · OpenRouter · Supabase · Telegram",
    year: "2025",
    shot: "assets/shots/aidahl.webp",
    essaySlug: "multi-provider-ai-gateway",
    desc: "Bring-Your-Own-Key Telegram AI assistant featuring live coalesced SSE streaming, named threads, and Manus research/image workflows.",
    descFa: "دستیار هوش مصنوعی تلگرام با معماری BYOK، استریم زنده پیام‌ها، گفتگوهای نام‌گذاری‌شده و ابزارهای تولید تصویر و پژوهش.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/AIDahl",
  },
  {
    id: "kite-downloader",
    name: "Kite Downloader",
    stack: "Rust · Tauri v2 · Tokio Async",
    year: "2026",
    shot: "assets/shots/kite-downloader.webp",
    essaySlug: "",
    desc: "Lightweight native Windows download manager under 8 MB featuring segmented range downloads and clipboard sniffing.",
    descFa: "مدیریت دانلود سبک و سریع دسکتاپ با Rust و Tauri v2 با حجم زیر ۸ مگابایت و دانلود چندبخشی فایل‌ها.",
    live: "",
    repo: "https://github.com/mohsen-niksirat/kite-downloader",
  },
  {
    id: "macos-portfolio",
    name: "Interactive macOS & iOS Portfolio",
    stack: "React 19 · Vite · Tailwind 4 · GSAP",
    year: "2026",
    shot: "assets/shots/macos-portfolio.png",
    essaySlug: "",
    desc: "Bilingual desktop and mobile operating-system portfolio featuring Finder, Safari case studies, zsh Terminal, Spotlight, and live GitHub telemetry.",
    descFa: "پورتفولیوی تعاملی دوزبانه به سبک سیستم‌عامل macOS و iOS مجهز به ترمینال، مرورگر پروژه‌ها، ویجت‌های زنده و رزومه.",
    live: "https://mohsen-niksirat.github.io/Profile/",
    repo: "https://github.com/mohsen-niksirat/Profile",
  },
];

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
  const inlineCodes = [];
  let s = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = inlineCodes.length;
    inlineCodes.push(`<code>${esc(code)}</code>`);
    return `@@INLINE_${idx}@@`;
  });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const external = /^https?:\/\//.test(href);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${attrs}>${label}</a>`;
  });
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(/@@INLINE_(\d+)@@/g, (_, idx) => inlineCodes[Number(idx)]);
  return s;
}

function renderMarkdown(md, locale = "en", diagramKey = "") {
  const codeBlocks = [];
  const withPlaceholders = md.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const cleanCode = code.replace(/\n$/, "");
    const langLabel = (lang || "text").toUpperCase();
    const copyLabel = locale === "fa" ? "کپی" : "Copy";
    codeBlocks.push(
      `<div class="code-block">
        <div class="code-head"><span>${esc(langLabel)}</span><button type="button" class="copy-btn" data-copy-code>${copyLabel}</button></div>
        <pre dir="ltr"><code>${highlightCode(cleanCode)}</code></pre>
      </div>`
    );
    return `@@CODEBLOCK_${idx}@@`;
  });

  const headings = [];
  let pullQuote = "";
  const lines = withPlaceholders.split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }
    if (line.startsWith("@@CODEBLOCK_")) {
      const idx = Number(line.replace("@@CODEBLOCK_", "").replace("@@", ""));
      out.push(codeBlocks[idx]);
      i++;
      continue;
    }
    if (line === "{{DIAGRAM}}") {
      const fn = diagramKey && DIAGRAMS[diagramKey];
      if (typeof fn === "function") {
        out.push(fn(locale));
      }
      i++;
      continue;
    }
    if (line.startsWith("<!--")) {
      i++;
      continue;
    }
    const hMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      const id = `sec-${headings.length + 1}`;
      headings.push({ id, level, text });
      out.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }
    if (line.startsWith(">")) {
      const qLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        qLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const qText = qLines.join(" ");
      if (!pullQuote) pullQuote = qText;
      out.push(`<blockquote class="pull-quote"><p>${renderInline(qText)}</p></blockquote>`);
      continue;
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(`<li>${renderInline(lines[i].trim().slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    const pLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("- ") &&
      !lines[i].trim().startsWith("* ") &&
      !lines[i].trim().startsWith("@@CODEBLOCK_") &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${renderInline(pLines.join(" "))}</p>`);
  }

  return { html: out.join("\n"), headings, pullQuote };
}

function loadPosts(locale) {
  const dir = path.join(ROOT, "content", "posts", locale);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const { html, headings, pullQuote } = renderMarkdown(body, locale, meta.diagram || "");
    const words = body.split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(2, Math.ceil(words / (locale === "fa" ? 160 : 200)));
    const vis = POST_VISUALS[slug] || { src: "assets/shots/9router.webp", alt: meta.title, altFa: meta.title, year: "2026", sceneState: 0 };
    return {
      slug,
      locale,
      title: meta.title || slug,
      subtitle: meta.subtitle || meta.description || "",
      date: meta.date || "2026-10-01",
      dateFormatted: formatDate(meta.date || "2026-10-01", locale),
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      readingMinutes: minutes,
      readingLabel: locale === "fa" ? `${toFaDigits(minutes)} دقیقه مطالعه` : `${minutes} min read`,
      cover: vis.src,
      coverAlt: locale === "fa" ? vis.altFa : vis.alt,
      sceneState: vis.sceneState,
      pullQuote: pullQuote || meta.subtitle || meta.description || "",
      headings,
      html,
      plainText: body.replace(/```[\s\S]*?```/g, " ").replace(/[#>*`[\]()]/g, " ").replace(/\s+/g, " ").trim(),
    };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const notesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "notes.json"), "utf8"));
const notes = notesRaw.map((n) => ({
  ...n,
  dateEn: formatDate(n.date, "en"),
  dateFa: formatDate(n.date, "fa"),
}));

const data = {
  posts: {
    en: loadPosts("en"),
    fa: loadPosts("fa"),
  },
  notes,
  projects: PROJECTS,
};

const outDir = path.join(ROOT, "src", "data");
fs.mkdirSync(outDir, { recursive: true });
const serialized = JSON.stringify(data, null, 2);
if (serialized.includes("{{")) {
  throw new Error("Build failed: raw template token '{{' leaked into src/data/content.json");
}
fs.writeFileSync(path.join(outDir, "content.json"), serialized, "utf8");
console.log(`Generated src/data/content.json (${data.posts.en.length} EN essays, ${data.posts.fa.length} FA essays, ${data.notes.length} notes, ${data.projects.length} projects)`);

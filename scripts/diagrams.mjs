// Crisp authored geometric SVG schematics for Mohsen Niksirat's Engineering Journal.
// Every diagram uses CSS custom properties so Light (Archival Paper) and Dark (Obsidian Slate)
// themes render with high-contrast precision.

export const DIAGRAMS = {
  "gateway-topology": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "معماری درگاه چندسرویس‌دهنده هوش مصنوعی و مدیریت خطای ۴۲۹" : "Multi-provider AI gateway routing and HTTP 429 circuit-breaker topology"}">
  <svg viewBox="0 0 760 270" width="760" height="270" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="268" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <!-- Client Node -->
    <rect x="26" y="92" width="144" height="86" rx="8" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="98" y="122" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="600">CLIENT / TMA</text>
    <text x="98" y="142" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">SSE Stream +</text>
    <text x="98" y="158" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">AES-GCM BYOK</text>

    <!-- Connector Client -> Router -->
    <line x1="170" y1="135" x2="246" y2="135" stroke="var(--text-muted)" stroke-width="1.5" />
    <polygon points="246,135 238,130 238,140" fill="var(--text-muted)" />

    <!-- Router Core -->
    <rect x="250" y="54" width="214" height="162" rx="10" fill="var(--bg-canvas)" stroke="var(--accent)" stroke-width="1.6" />
    <text x="357" y="82" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">9ROUTER ENGINE</text>
    <line x1="268" y1="94" x2="446" y2="94" stroke="var(--border)" />
    <text x="357" y="116" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5" font-weight="600">Health-Weighted Pool</text>
    <text x="357" y="136" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">1. Round-Robin / Latency</text>
    <text x="357" y="154" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">2. 429 Cooldown + Jitter</text>
    <text x="357" y="172" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">3. Auto Provider Failover</text>
    <rect x="274" y="185" width="166" height="20" rx="4" fill="var(--accent-soft)" />
    <text x="357" y="199" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="10" font-weight="600">failover &lt; 18ms overhead</text>

    <!-- Provider Pool -->
    <path d="M464 102 C505 102, 505 56, 548 56" stroke="var(--accent)" stroke-width="1.5" />
    <polygon points="548,56 540,52 540,60" fill="var(--accent)" />

    <path d="M464 124 C505 124, 505 108, 548 108" stroke="var(--text-muted)" stroke-width="1.3" stroke-dasharray="4 3" />
    <path d="M464 146 C505 146, 505 160, 548 160" stroke="var(--accent)" stroke-width="1.5" />
    <polygon points="548,160 540,156 540,164" fill="var(--accent)" />
    <path d="M464 168 C505 168, 505 212, 548 212" stroke="var(--text-muted)" stroke-width="1.3" />

    <!-- Upstream Cards -->
    <rect x="552" y="36" width="182" height="40" rx="6" fill="var(--bg-canvas)" stroke="var(--accent)" />
    <circle cx="570" cy="56" r="4.5" fill="var(--accent)" />
    <text x="584" y="60" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">Gemini 2.5 · Healthy</text>

    <rect x="552" y="88" width="182" height="40" rx="6" fill="var(--bg-canvas)" stroke="var(--border)" opacity="0.72" />
    <line x1="566" y1="104" x2="574" y2="112" stroke="var(--text-muted)" stroke-width="1.6" />
    <line x1="574" y1="104" x2="566" y2="112" stroke="var(--text-muted)" stroke-width="1.6" />
    <text x="584" y="112" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11">Groq · 429 Cooldown 30s</text>

    <rect x="552" y="140" width="182" height="40" rx="6" fill="var(--bg-canvas)" stroke="var(--accent)" />
    <circle cx="570" cy="160" r="4.5" fill="var(--accent)" />
    <text x="584" y="164" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">DeepSeek · Fallback #1</text>

    <rect x="552" y="192" width="182" height="40" rx="6" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <circle cx="570" cy="212" r="4" fill="var(--text-muted)" />
    <text x="584" y="216" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">OpenRouter / OpenAI</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: توپولوژی مسیریابی در 9router و AIDahl؛ کلیدهای دارای خطای ۴۲۹ وارد دوره استراحت می‌شوند و درخواست بدون قطعی روی سرویس‌دهنده سالم بعدی اجرا می‌گردد." : "Figure 1: Request routing in 9router and AIDahl. Keys returning HTTP 429 enter a jittered cooldown window while in-flight requests retry transparently on the next healthy provider."}</figcaption>
</figure>`;
  },

  "fsrs-curve": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "مقایسه منحنی ماندگاری حافظه در الگوریتم FSRS با جعبه‌های ثابت لایتنر" : "FSRS adaptive memory stability curves compared against fixed Leitner resets"}">
  <svg viewBox="0 0 760 260" width="760" height="260" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="258" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <!-- Axes -->
    <line x1="76" y1="36" x2="76" y2="208" stroke="var(--border-strong)" stroke-width="1.4" />
    <line x1="76" y1="208" x2="716" y2="208" stroke="var(--border-strong)" stroke-width="1.4" />
    <!-- 90% Target Retention Line -->
    <line x1="76" y1="74" x2="716" y2="74" stroke="var(--accent)" stroke-width="1" stroke-dasharray="5 4" />
    <text x="68" y="44" text-anchor="end" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10.5">100%</text>
    <text x="68" y="78" text-anchor="end" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="600">90% R*</text>
    <text x="68" y="208" text-anchor="end" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10.5">50%</text>

    <!-- FSRS Stability Growth Curves -->
    <path d="M76 40 Q108 62, 140 74 L140 40 Q210 62, 276 74 L276 40 Q400 60, 510 74 L510 40 Q620 55, 706 70" stroke="var(--accent)" stroke-width="2.2" fill="none" />
    <!-- Rigid Leitner Reset Sawtooth -->
    <path d="M76 40 Q96 68, 114 96 L114 40 Q145 78, 178 124 L178 40 Q202 80, 224 132 L224 40 Q258 76, 294 118" stroke="var(--text-muted)" stroke-width="1.4" stroke-dasharray="3 3" fill="none" />

    <!-- Review Nodes -->
    <circle cx="140" cy="74" r="4" fill="var(--accent)" />
    <circle cx="276" cy="74" r="4" fill="var(--accent)" />
    <circle cx="510" cy="74" r="4" fill="var(--accent)" />

    <text x="140" y="228" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">S₁ = 1.8d</text>
    <text x="276" y="228" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">S₂ = 7.4d</text>
    <text x="510" y="228" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">S₃ = 26.5d</text>
    <text x="684" y="228" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">S₄ = 84d</text>

    <!-- Legend -->
    <rect x="448" y="138" width="248" height="54" rx="6" fill="var(--bg-canvas)" stroke="var(--border)" />
    <line x1="464" y1="156" x2="490" y2="156" stroke="var(--accent)" stroke-width="2.2" />
    <text x="498" y="160" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11" font-weight="600">FSRS Stability Scheduling</text>
    <line x1="464" y1="176" x2="490" y2="176" stroke="var(--text-muted)" stroke-width="1.4" stroke-dasharray="3 3" />
    <text x="498" y="180" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Classic Box-1 Penalty Reset</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: زمان‌بندی مرور در Readner بر اساس آستانه یادآوری ۹۰٪؛ پایداری حافظه (S) پس از هر مرور موفق به‌طور نمایی رشد می‌کند." : "Figure 1: Review scheduling in Readner (Leitner Pro Max) anchored at 90% retrievability (R*). Each successful recall compounds stability S instead of marching through rigid box steps."}</figcaption>
</figure>`;
  },

  "local-first-pipeline": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "خط لوله پردازش کاملاً محلی در مرورگر بدون ارسال داده به سرور" : "Browser-only repository and dataset analysis pipeline with zero server uploads"}">
  <svg viewBox="0 0 760 230" width="760" height="230" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="228" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <!-- Browser Sandbox Boundary -->
    <rect x="22" y="24" width="716" height="182" rx="8" fill="var(--bg-canvas)" stroke="var(--accent)" stroke-dasharray="6 4" stroke-width="1.4" />
    <text x="38" y="46" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="700">BROWSER SANDBOX BOUNDARY · ZERO THIRD-PARTY UPLOADS</text>

    <!-- Step 1 -->
    <rect x="42" y="72" width="150" height="98" rx="7" fill="var(--bg-surface)" stroke="var(--border-strong)" />
    <text x="117" y="102" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">1. INGEST</text>
    <text x="117" y="124" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">Git Trees API (?recursive=1)</text>
    <text x="117" y="142" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="10.5">or Local CSV / XLSX File</text>

    <line x1="192" y1="121" x2="222" y2="121" stroke="var(--text-muted)" stroke-width="1.5" />
    <polygon points="222,121 214,116 214,126" fill="var(--text-muted)" />

    <!-- Step 2 -->
    <rect x="226" y="72" width="152" height="98" rx="7" fill="var(--bg-surface)" stroke="var(--border-strong)" />
    <text x="302" y="102" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">2. PRUNE &amp; PARSE</text>
    <text x="302" y="124" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">Ignore Lockfiles &amp; Binaries</text>
    <text x="302" y="142" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="10.5">Typed Column Inference</text>

    <line x1="378" y1="121" x2="408" y2="121" stroke="var(--text-muted)" stroke-width="1.5" />
    <polygon points="408,121 400,116 400,126" fill="var(--text-muted)" />

    <!-- Step 3 -->
    <rect x="412" y="72" width="146" height="98" rx="7" fill="var(--bg-surface)" stroke="var(--border-strong)" />
    <text x="485" y="102" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">3. SCORE &amp; BUDGET</text>
    <text x="485" y="124" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">0–100 Health / WCAG</text>
    <text x="485" y="142" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="10.5">Token Window Counter</text>

    <line x1="558" y1="121" x2="588" y2="121" stroke="var(--accent)" stroke-width="1.5" />
    <polygon points="588,121 580,116 580,126" fill="var(--accent)" />

    <!-- Step 4 -->
    <rect x="592" y="72" width="126" height="98" rx="7" fill="var(--accent-soft)" stroke="var(--accent)" />
    <text x="655" y="102" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="11" font-weight="700">4. ARTIFACT</text>
    <text x="655" y="124" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11">LLM Digest MD</text>
    <text x="655" y="142" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="10.5">SVG Chart / Audit</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: معماری مشترک در Repodest، DataLens و A11y Inspector؛ کل چرخه دریافت، پارس، امتیازدهی و تولید خروجی درون حافظه مرورگر کاربر انجام می‌شود." : "Figure 1: Shared local-first execution model across Repodest, DataLens, and A11y Inspector. Ingestion, pruning, scoring, and export execute entirely inside browser memory."}</figcaption>
</figure>`;
  },

  "wasm-spatial-grid": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "شبکه مکانی برخورد و استخر اشیاء در خروجی WebAssembly موتور Godot 4" : "Uniform spatial hash grid and projectile ring buffer in Godot 4 WebAssembly"}">
  <svg viewBox="0 0 760 240" width="760" height="240" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="238" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <!-- Spatial Grid -->
    <g transform="translate(44, 30)">
      <rect x="0" y="0" width="220" height="180" rx="6" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
      <line x1="55" y1="0" x2="55" y2="180" stroke="var(--border)" />
      <line x1="110" y1="0" x2="110" y2="180" stroke="var(--border)" />
      <line x1="165" y1="0" x2="165" y2="180" stroke="var(--border)" />
      <line x1="0" y1="45" x2="220" y2="45" stroke="var(--border)" />
      <line x1="0" y1="90" x2="220" y2="90" stroke="var(--border)" />
      <line x1="0" y1="135" x2="220" y2="135" stroke="var(--border)" />
      <!-- Active 3x3 Query Neighborhood -->
      <rect x="55" y="45" width="110" height="90" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
      <circle cx="110" cy="90" r="6" fill="var(--accent)" />
      <circle cx="82" cy="68" r="3.5" fill="var(--text-primary)" />
      <circle cx="142" cy="76" r="3.5" fill="var(--text-primary)" />
      <circle cx="128" cy="116" r="3.5" fill="var(--text-primary)" />
      <circle cx="24" cy="24" r="3.5" fill="var(--text-muted)" opacity="0.45" />
      <circle cx="194" cy="156" r="3.5" fill="var(--text-muted)" opacity="0.45" />
      <circle cx="188" cy="28" r="3.5" fill="var(--text-muted)" opacity="0.45" />
    </g>
    <!-- Right Panel: Frame Budget Breakdown -->
    <rect x="308" y="30" width="410" height="180" rx="8" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="330" y="58" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">16.6ms WASM FRAME BUDGET (60 FPS)</text>
    <text x="330" y="88" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11.5">Naive CharacterBody3D × 300 mobs (24.8ms · drops to 38 FPS)</text>
    <rect x="330" y="96" width="356" height="14" rx="3" fill="var(--border)" />
    <rect x="330" y="96" width="356" height="14" rx="3" fill="var(--text-muted)" opacity="0.55" />

    <text x="330" y="138" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5" font-weight="600">Spatial Hash + Squared-Distance Pool (6.1ms · locked 60 FPS)</text>
    <rect x="330" y="146" width="356" height="14" rx="3" fill="var(--border)" />
    <rect x="330" y="146" width="132" height="14" rx="3" fill="var(--accent)" />

    <text x="330" y="188" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10.5">Zero GC allocations per wave · Pre-warmed WebGL shaders</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: بررسی همسایگی ۳×۳ در شبکه مکانی به‌جای مقایسه دوبه‌دوی تمام دشمنان، زمان فیزیک هر فریم را به ۶.۱ میلی‌ثانیه کاهش می‌دهد." : "Figure 1: Querying only the highlighted 3×3 spatial hash neighborhood plus pre-allocated object pools keeps total frame simulation at 6.1ms inside browser WebAssembly."}</figcaption>
</figure>`;
  },

  "mcp-jsonrpc": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "چگونگی بازرسی اسکیمای ابزارها و پیام‌های JSON-RPC در MCP Studio" : "JSON-RPC 2.0 inspection flow between MCP Studio and an MCP tool server"}">
  <svg viewBox="0 0 760 220" width="760" height="220" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="218" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <rect x="32" y="42" width="196" height="136" rx="8" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="130" y="72" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">MCP STUDIO UI</text>
    <text x="130" y="98" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">JSON Schema -> Form UI</text>
    <text x="130" y="118" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">Payload Diff &amp; Latency</text>
    <text x="130" y="138" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5">Interactive Replay</text>

    <!-- Bidirectional Wire -->
    <line x1="232" y1="88" x2="524" y2="88" stroke="var(--accent)" stroke-width="1.6" />
    <polygon points="524,88 516,83 516,93" fill="var(--accent)" />
    <text x="378" y="78" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="10.5" font-weight="600">tools/list · tools/call (JSON-RPC 2.0)</text>

    <line x1="524" y1="136" x2="232" y2="136" stroke="var(--text-muted)" stroke-width="1.5" stroke-dasharray="5 3" />
    <polygon points="232,136 240,131 240,141" fill="var(--text-muted)" />
    <text x="378" y="156" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">content[] + isError + structured trace</text>

    <rect x="528" y="42" width="200" height="136" rx="8" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="628" y="72" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">MCP SERVER</text>
    <text x="628" y="98" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">Tools · Resources · Prompts</text>
    <text x="628" y="118" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">SSE / Streamable HTTP</text>
    <text x="628" y="138" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Zod / Pydantic Schemas</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: چرخه تست تعاملی در MCP Studio؛ اسکیمای JSON هر ابزار به فرم قابل ویرایش تبدیل شده و پاسخ خام سرور به‌همراه زمان اجرا ثبت می‌شود." : "Figure 1: Interactive debugging loop in MCP Studio. Exposed JSON Schemas become typed form inputs, capturing raw JSON-RPC frames and execution latency."}</figcaption>
</figure>`;
  },

  "canvas-timeline": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "نوار گام‌های تغییرناپذیر و همگام‌سازی کد و گرافیک در CodeVis" : "Immutable step tape synchronizing Canvas 2D state and code line highlights in CodeVis"}">
  <svg viewBox="0 0 760 220" width="760" height="220" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
    <rect x="1" y="1" width="758" height="218" rx="10" fill="var(--bg-surface)" stroke="var(--border)" />
    <!-- Step Tape -->
    <rect x="44" y="34" width="672" height="48" rx="7" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="64" y="62" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10.5">TAPE:</text>
    <rect x="116" y="44" width="84" height="28" rx="4" fill="var(--bg-surface)" stroke="var(--border)" />
    <text x="158" y="62" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">Step 04</text>
    <rect x="212" y="44" width="84" height="28" rx="4" fill="var(--bg-surface)" stroke="var(--border)" />
    <text x="254" y="62" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">Step 05</text>
    <rect x="308" y="42" width="108" height="32" rx="5" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5" />
    <text x="362" y="62" text-anchor="middle" fill="var(--accent)" font-family="var(--font-mono)" font-size="11" font-weight="700">Step 06 ●</text>
    <rect x="428" y="44" width="84" height="28" rx="4" fill="var(--bg-surface)" stroke="var(--border)" />
    <text x="470" y="62" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">Step 07</text>
    <text x="614" y="62" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="10.5">◀ Scrub / 1.5x ▶</text>

    <!-- Dual Projections -->
    <line x1="362" y1="82" x2="220" y2="114" stroke="var(--accent)" stroke-width="1.5" />
    <line x1="362" y1="82" x2="536" y2="114" stroke="var(--accent)" stroke-width="1.5" />

    <rect x="74" y="114" width="286" height="74" rx="7" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="217" y="142" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">Canvas 2D Frame Interpolation</text>
    <text x="217" y="164" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Node positions, swap arcs &amp; pointer badges</text>

    <rect x="400" y="114" width="286" height="74" rx="7" fill="var(--bg-canvas)" stroke="var(--border-strong)" />
    <text x="543" y="142" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">Synchronized Code Trace</text>
    <text x="543" y="164" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Active line highlight + call-stack variables</text>
  </svg>
  <figcaption>${fa ? "شکل ۱: معماری نوار وضعیت در CodeVis؛ اجرای الگوریتم یک‌بار به آرایه‌ای از اسنپ‌شات‌های تغییرناپذیر تبدیل می‌شود تا حرکت رو به عقب و جلو آنی باشد." : "Figure 1: Deterministic step-tape architecture in CodeVis. Recording immutable snapshots decouples algorithm execution from 60 FPS Canvas scrubbing."}</figcaption>
</figure>`;
  },
};

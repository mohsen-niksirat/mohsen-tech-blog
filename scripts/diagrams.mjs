// Theme-adaptive vector architectural schematics & interactive engineering simulators
// for Mohsen Niksirat's Publication. Every color resolves through WCAG AA semantic tokens.

export const DIAGRAMS = {
  "gateway-topology": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "شبیه‌ساز تعاملی درگاه 9router و مدیریت خطای ۴۲۹" : "Interactive 9router AI gateway topology and HTTP 429 failover simulator"}">
  <div class="schematic-stage" data-gateway-sim data-fault="false">
    <svg viewBox="0 0 820 295" width="820" height="295" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <rect x="20" y="90" width="166" height="114" rx="14" fill="var(--diag-node)" stroke="var(--border-strong)" stroke-width="1.5" />
      <circle cx="44" cy="118" r="5" fill="var(--diag-cyan)" />
      <text x="58" y="122" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">CLIENT / TMA</text>
      <text x="40" y="148" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11.5">SSE Token Stream</text>
      <rect x="40" y="164" width="126" height="26" rx="6" fill="var(--bg-surface)" stroke="var(--border)" />
      <text x="103" y="181" text-anchor="middle" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="10" font-weight="700">AES-256-GCM BYOK</text>

      <!-- Inbound Signal Wire -->
      <line x1="186" y1="147" x2="270" y2="147" stroke="var(--border-strong)" stroke-width="2" />
      <line x1="186" y1="147" x2="270" y2="147" stroke="var(--diag-cyan)" stroke-width="2.5" stroke-dasharray="8 7" class="flow-pulse" />

      <!-- 9Router Core -->
      <rect x="272" y="48" width="244" height="198" rx="16" fill="var(--diag-node)" stroke="var(--diag-cyan)" stroke-width="1.8" />
      <text x="394" y="78" text-anchor="middle" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="12" font-weight="700">9ROUTER SMART ENGINE</text>
      <line x1="294" y1="92" x2="494" y2="92" stroke="var(--border)" />
      <text x="394" y="116" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="12" font-weight="600">EWMA Latency + Health Pool</text>
      <text x="394" y="140" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">• Round-Robin / Smart Weight</text>
      <text x="394" y="160" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">• HTTP 429 Cooldown + Jitter</text>
      <text x="394" y="180" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="10.5">• OpenAI / Gemini Adapter</text>
      <rect x="304" y="198" width="180" height="28" rx="8" fill="var(--bg-surface)" stroke="var(--border-strong)" />
      <text x="394" y="216" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="10.5" font-weight="700" data-gw-status>Active: Gemini 2.5 (14ms)</text>

      <!-- Route Wires -->
      <path data-gw-wire="gemini" d="M516 108 C560 108, 560 54, 606 54" stroke="var(--diag-emerald)" stroke-width="2.4" stroke-dasharray="7 7" class="flow-pulse" />
      <path data-gw-wire="groq" d="M516 134 C560 134, 560 116, 606 116" stroke="var(--diag-rose)" stroke-width="1.6" stroke-dasharray="4 4" opacity="0.65" />
      <path data-gw-wire="deepseek" d="M516 160 C560 160, 560 178, 606 178" stroke="var(--border-strong)" stroke-width="1.6" />
      <path data-gw-wire="openrouter" d="M516 186 C560 186, 560 240, 606 240" stroke="var(--border-strong)" stroke-width="1.6" />

      <!-- Upstream Nodes -->
      <g data-gw-node="gemini">
        <rect x="608" y="32" width="190" height="44" rx="10" fill="var(--diag-node)" stroke="var(--diag-emerald)" stroke-width="1.6" />
        <circle cx="628" cy="54" r="5" fill="var(--diag-emerald)" />
        <text x="642" y="58" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600" data-gw-gemini-txt>Gemini 2.5 · Healthy</text>
      </g>

      <rect x="608" y="94" width="190" height="44" rx="10" fill="var(--diag-node)" stroke="var(--diag-rose)" stroke-opacity="0.65" />
      <circle cx="628" cy="116" r="5" fill="var(--diag-rose)" />
      <text x="642" y="120" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11">Groq · 429 Cooldown 30s</text>

      <g data-gw-node="deepseek">
        <rect x="608" y="156" width="190" height="44" rx="10" fill="var(--diag-node)" stroke="var(--border-strong)" stroke-width="1.4" />
        <circle cx="628" cy="178" r="5" fill="var(--diag-cyan)" />
        <text x="642" y="182" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600" data-gw-ds-txt>DeepSeek V3 · Ready</text>
      </g>

      <rect x="608" y="218" width="190" height="44" rx="10" fill="var(--diag-node)" stroke="var(--border-strong)" />
      <circle cx="628" cy="240" r="5" fill="var(--diag-violet)" />
      <text x="642" y="244" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">OpenRouter · Standby</text>
    </svg>

    <div class="sim-controls">
      <div class="sim-readout">
        <span>${fa ? "وضعیت شبیه‌ساز روتینگ:" : "Routing Telemetry:"}</span>
        <strong class="sim-badge ltr" data-gw-badge>${fa ? "سالم · Gemini 2.5 (14ms)" : "Primary · Gemini 2.5 (14ms)"}</strong>
      </div>
      <button type="button" class="btn-secondary sim-action" data-gw-toggle>${fa ? "شبیه‌سازی خطای ۴۲۹ روی Gemini" : "Simulate HTTP 429 on Gemini"}</button>
    </div>
  </div>
  <figcaption>${fa ? "شکل ۱: شبیه‌ساز زنده مسیریابی در 9router و AIDahl؛ دکمه بالا را بزنید تا جابه‌جایی آنی ترافیک به DeepSeek پس از خطای ۴۲۹ را ببینید." : "Figure 1: Interactive 9router circuit-breaker topology. Click above to inject an upstream HTTP 429 fault and watch failover shift cleanly to DeepSeek V3."}</figcaption>
</figure>`;
  },

  "fsrs-curve": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "شبیه‌ساز تعاملی منحنی فراموشی FSRS" : "Interactive FSRS memory stability simulator"}">
  <div class="schematic-stage">
    <svg viewBox="0 0 820 265" width="820" height="265" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <line x1="78" y1="28" x2="78" y2="210" stroke="var(--border-strong)" stroke-width="1.5" />
      <line x1="78" y1="210" x2="776" y2="210" stroke="var(--border-strong)" stroke-width="1.5" />
      <line x1="78" y1="70" x2="776" y2="70" stroke="var(--diag-emerald)" stroke-width="1.2" stroke-dasharray="6 4" />

      <text x="66" y="36" text-anchor="end" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11">100%</text>
      <text x="66" y="74" text-anchor="end" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11" font-weight="700">90% R*</text>
      <text x="66" y="210" text-anchor="end" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11">50%</text>

      <path d="M78 32 Q116 56, 152 70 L152 32 Q230 56, 308 70 L308 32 Q440 54, 566 70 L566 32 Q680 48, 768 64 L768 210 L78 210 Z" fill="var(--diag-emerald)" fill-opacity="0.12" />
      <path d="M78 32 Q116 56, 152 70 L152 32 Q230 56, 308 70 L308 32 Q440 54, 566 70 L566 32 Q680 48, 768 64" stroke="var(--diag-emerald)" stroke-width="2.6" fill="none" />
      <path d="M78 32 Q102 70, 122 108 L122 32 Q158 84, 194 144 L194 32 Q220 88, 246 150 L246 32 Q286 84, 326 134" stroke="var(--diag-rose)" stroke-width="1.6" stroke-dasharray="4 4" fill="none" />

      <circle cx="152" cy="70" r="5" fill="var(--diag-emerald)" />
      <circle cx="308" cy="70" r="5" fill="var(--diag-emerald)" />
      <circle cx="566" cy="70" r="5" fill="var(--diag-emerald)" />

      <text x="152" y="234" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">S₁ = 1.8d</text>
      <text x="308" y="234" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">S₂ = 7.4d</text>
      <text x="566" y="234" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11" font-weight="600">S₃ = 26.5d</text>
      <text x="742" y="234" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11" font-weight="700">S₄ = 84d</text>
    </svg>

    <div class="sim-controls" data-fsrs-widget>
      <div class="sim-slider-group">
        <label>${fa ? "پایداری حافظه (S):" : "Stability (S):"} <strong data-fsrs-s-val>12</strong> ${fa ? "روز" : "days"}</label>
        <input type="range" min="1" max="90" value="12" data-fsrs-s aria-label="${fa ? "پایداری حافظه به روز" : "Memory stability days"}">
      </div>
      <div class="sim-slider-group">
        <label>${fa ? "زمان سپری‌شده (t):" : "Elapsed (t):"} <strong data-fsrs-t-val>12</strong> ${fa ? "روز" : "days"}</label>
        <input type="range" min="0" max="90" value="12" data-fsrs-t aria-label="${fa ? "تعداد روز از مرور قبل" : "Elapsed days since review"}">
      </div>
      <div class="sim-readout">
        <span>${fa ? "احتمال یادآوری R(t,S):" : "Predicted Recall R(t,S):"}</span>
        <strong class="sim-badge ltr" data-fsrs-out>90.0%</strong>
      </div>
    </div>
  </div>
  <figcaption>${fa ? "شکل ۱: ماشین‌حساب زنده الگوریتم FSRS در Readner؛ با تغییر پایداری (S) و روزهای سپری‌شده (t)، احتمال به خاطر آوردن واژه لحظه‌ای محاسبه می‌شود." : "Figure 1: Live FSRS retrievability calculator from Readner. Drag Stability (S) and Elapsed Days (t) to evaluate memory decay."}</figcaption>
</figure>`;
  },

  "local-first-pipeline": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "خط لوله پردازش محلی مرورگر" : "Zero-upload browser sandbox execution pipeline"}">
  <div class="schematic-stage">
    <svg viewBox="0 0 820 245" width="820" height="245" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <rect x="20" y="20" width="780" height="205" rx="16" fill="var(--diag-node)" stroke="var(--diag-cyan)" stroke-dasharray="7 5" stroke-width="1.6" />
      <text x="42" y="48" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="11" font-weight="700">BROWSER SANDBOX · ZERO THIRD-PARTY SERVER UPLOADS</text>

      <rect x="42" y="74" width="166" height="122" rx="12" fill="var(--bg-surface)" stroke="var(--border-strong)" />
      <text x="125" y="106" text-anchor="middle" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">01 · INGEST</text>
      <text x="125" y="132" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5">Git Trees (?recursive=1)</text>
      <text x="125" y="154" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">CSV / XLSX / HTML</text>

      <line x1="208" y1="135" x2="238" y2="135" stroke="var(--diag-cyan)" stroke-width="2.2" stroke-dasharray="5 5" class="flow-pulse" />

      <rect x="240" y="74" width="166" height="122" rx="12" fill="var(--bg-surface)" stroke="var(--border-strong)" />
      <text x="323" y="106" text-anchor="middle" fill="var(--diag-violet)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">02 · PRUNE</text>
      <text x="323" y="132" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5">Drop Lockfiles &amp; Noise</text>
      <text x="323" y="154" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Inert DOMParser</text>

      <line x1="406" y1="135" x2="436" y2="135" stroke="var(--diag-violet)" stroke-width="2.2" stroke-dasharray="5 5" class="flow-pulse" />

      <rect x="438" y="74" width="166" height="122" rx="12" fill="var(--bg-surface)" stroke="var(--border-strong)" />
      <text x="521" y="106" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">03 · SCORE</text>
      <text x="521" y="132" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5">0–100 Health / WCAG</text>
      <text x="521" y="154" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11">Token Budget Counter</text>

      <line x1="604" y1="135" x2="634" y2="135" stroke="var(--diag-emerald)" stroke-width="2.2" stroke-dasharray="5 5" class="flow-pulse" />

      <rect x="636" y="74" width="142" height="122" rx="12" fill="var(--bg-surface)" stroke="var(--diag-emerald)" stroke-width="1.6" />
      <text x="707" y="106" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">04 · EXPORT</text>
      <text x="707" y="132" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5">LLM Prompt MD</text>
      <text x="707" y="154" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11">SVG Chart / Audit</text>
    </svg>

    <div class="sim-controls" data-token-sim>
      <input type="text" class="sim-text-input ltr" data-token-input value="export async function fetchRepoTree(owner, repo) { return fetch(\`https://api.github.com/repos/\${owner}/\${repo}\`); }" aria-label="${fa ? "نمونه کد برای تخمین توکن" : "Sample snippet for local token estimation"}">
      <div class="sim-readout">
        <span>${fa ? "تخمین محلی Repodest:" : "Client-Side Estimate:"}</span>
        <strong class="sim-badge ltr" data-token-out>~30 tokens · 113 chars</strong>
      </div>
    </div>
  </div>
  <figcaption>${fa ? "شکل ۱: معماری محلی مشترک بین Repodest، DataLens و A11y Inspector؛ درون کادر بالا بنویسید تا مصرف توکن کاملاً آفلاین محاسبه شود." : "Figure 1: Shared zero-upload pipeline across Repodest, DataLens, and A11y Inspector. Type or paste in the bar above to test Repodest's client-side token estimator."}</figcaption>
</figure>`;
  },

  "wasm-spatial-grid": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "مقایسه بودجه فریم WebAssembly با شبکه مکانی در Godot 4" : "Godot 4 WebAssembly spatial hash broadphase and 16.6ms frame budget"}">
  <div class="schematic-stage">
    <svg viewBox="0 0 820 250" width="820" height="250" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <g transform="translate(36, 24)">
        <rect x="0" y="0" width="240" height="202" rx="12" fill="var(--diag-node)" stroke="var(--border-strong)" />
        <line x1="60" y1="0" x2="60" y2="202" stroke="var(--border)" />
        <line x1="120" y1="0" x2="120" y2="202" stroke="var(--border)" />
        <line x1="180" y1="0" x2="180" y2="202" stroke="var(--border)" />
        <line x1="0" y1="50" x2="240" y2="50" stroke="var(--border)" />
        <line x1="0" y1="101" x2="240" y2="101" stroke="var(--border)" />
        <line x1="0" y1="152" x2="240" y2="152" stroke="var(--border)" />
        <rect x="60" y="50" width="120" height="102" rx="4" fill="var(--diag-amber)" fill-opacity="0.16" stroke="var(--diag-amber)" stroke-width="1.8" />
        <circle cx="120" cy="101" r="28" stroke="var(--diag-amber)" stroke-dasharray="4 3" />
        <circle cx="120" cy="101" r="6.5" fill="var(--diag-amber)" />
        <circle cx="96" cy="82" r="4" fill="var(--diag-cyan)" />
        <circle cx="148" cy="92" r="4" fill="var(--diag-cyan)" />
        <circle cx="136" cy="126" r="4" fill="var(--diag-cyan)" />
        <circle cx="28" cy="28" r="3.5" fill="var(--text-muted)" opacity="0.45" />
        <circle cx="208" cy="176" r="3.5" fill="var(--text-muted)" opacity="0.45" />
        <circle cx="204" cy="34" r="3.5" fill="var(--text-muted)" opacity="0.45" />
      </g>

      <rect x="312" y="24" width="472" height="202" rx="14" fill="var(--diag-node)" stroke="var(--border-strong)" />
      <text x="338" y="58" fill="var(--diag-amber)" font-family="var(--font-mono)" font-size="12" font-weight="700">16.6ms BROWSER WASM BUDGET (LOCKED 60 FPS)</text>

      <text x="338" y="94" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="12">Naive CharacterBody3D × 300 enemies · 24.8ms (Drops to 38 FPS)</text>
      <rect x="338" y="104" width="416" height="16" rx="5" fill="var(--bg-surface)" />
      <rect x="338" y="104" width="416" height="16" rx="5" fill="var(--diag-rose)" opacity="0.82" />

      <text x="338" y="150" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="12" font-weight="600">Spatial Grid 3×3 + Ring-Buffer Pool · 6.1ms (Locked 60 FPS)</text>
      <rect x="338" y="160" width="416" height="16" rx="5" fill="var(--bg-surface)" />
      <rect x="338" y="160" width="154" height="16" rx="5" fill="var(--diag-emerald)" />

      <text x="338" y="204" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11">0 GC spikes · Pre-warmed WebGL 2 particle shaders</text>
    </svg>
  </div>
  <figcaption>${fa ? "شکل ۱: جستجوی همسایگی ۳×۳ در شبکه مکانی به همراه استخر اشیاء، زمان شبیه‌سازی هر فریم را از ۲۴.۸ به ۶.۱ میلی‌ثانیه رساند." : "Figure 1: Querying only the 3×3 spatial hash neighborhood around projectiles keeps total frame simulation at 6.1ms inside browser WebAssembly."}</figcaption>
</figure>`;
  },

  "mcp-jsonrpc": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "جریان پیام‌های JSON-RPC 2.0 در MCP Studio" : "Bidirectional JSON-RPC 2.0 inspection inside MCP Studio"}">
  <div class="schematic-stage">
    <svg viewBox="0 0 820 235" width="820" height="235" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <rect x="32" y="34" width="224" height="166" rx="14" fill="var(--diag-node)" stroke="var(--diag-violet)" stroke-width="1.6" />
      <text x="144" y="68" text-anchor="middle" fill="var(--diag-violet)" font-family="var(--font-mono)" font-size="12" font-weight="700">MCP STUDIO IDE</text>
      <text x="144" y="98" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-sans)" font-size="11.5">Auto Schema Form Builder</text>
      <text x="144" y="122" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11.5">Live JSON-RPC Wire Diff</text>
      <rect x="64" y="144" width="160" height="30" rx="7" fill="var(--bg-surface)" stroke="var(--border-strong)" />
      <text x="144" y="163" text-anchor="middle" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="10.5">1-Click Tool Replay</text>

      <line x1="256" y1="92" x2="562" y2="92" stroke="var(--diag-violet)" stroke-width="2.4" stroke-dasharray="7 6" class="flow-pulse" />
      <text x="409" y="80" text-anchor="middle" fill="var(--diag-violet)" font-family="var(--font-mono)" font-size="11" font-weight="600">initialize · tools/list · tools/call</text>

      <line x1="562" y1="146" x2="256" y2="146" stroke="var(--diag-emerald)" stroke-width="2.2" stroke-dasharray="6 6" class="flow-pulse" />
      <text x="409" y="168" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11">result.content[] · isError · latencyMs</text>

      <rect x="564" y="34" width="224" height="166" rx="14" fill="var(--diag-node)" stroke="var(--border-strong)" stroke-width="1.5" />
      <text x="676" y="68" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="12" font-weight="700">MCP TOOL SERVER</text>
      <text x="676" y="98" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">Tools · Resources · Prompts</text>
      <text x="676" y="122" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11.5">Streamable HTTP / SSE</text>
      <text x="676" y="146" text-anchor="middle" fill="var(--text-muted)" font-family="var(--font-sans)" font-size="11.5">Zod &amp; Pydantic Validators</text>
    </svg>
  </div>
  <figcaption>${fa ? "شکل ۱: چرخه بازرسی دوطرفه در MCP Studio بین فرم‌های تولیدشده از JSON Schema و سرور ابزار." : "Figure 1: Bidirectional JSON-RPC 2.0 inspection loop between MCP Studio's generated schema forms and an MCP server."}</figcaption>
</figure>`;
  },

  "canvas-timeline": (locale = "en") => {
    const fa = locale === "fa";
    return `<figure class="schematic" role="group" aria-label="${fa ? "معماری نوار وضعیت تغییرناپذیر در CodeVis" : "Immutable step-tape playback architecture in CodeVis"}">
  <div class="schematic-stage">
    <svg viewBox="0 0 820 235" width="820" height="235" fill="none" xmlns="http://www.w3.org/2000/svg" dir="ltr">
      <rect x="36" y="26" width="748" height="58" rx="12" fill="var(--diag-node)" stroke="var(--border-strong)" />
      <text x="62" y="60" fill="var(--text-muted)" font-family="var(--font-mono)" font-size="11" font-weight="600">STEP TAPE:</text>
      <rect x="148" y="38" width="92" height="34" rx="7" fill="var(--bg-surface)" stroke="var(--border)" />
      <text x="194" y="59" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">Step 04</text>
      <rect x="252" y="38" width="92" height="34" rx="7" fill="var(--bg-surface)" stroke="var(--border)" />
      <text x="298" y="59" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">Step 05</text>
      <rect x="356" y="36" width="118" height="38" rx="8" fill="var(--diag-emerald)" fill-opacity="0.16" stroke="var(--diag-emerald)" stroke-width="1.8" />
      <text x="415" y="59" text-anchor="middle" fill="var(--diag-emerald)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Step 06 ●</text>
      <rect x="486" y="38" width="92" height="34" rx="7" fill="var(--bg-surface)" stroke="var(--border)" />
      <text x="532" y="59" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-mono)" font-size="11">Step 07</text>
      <text x="682" y="59" text-anchor="middle" fill="var(--diag-cyan)" font-family="var(--font-mono)" font-size="11" font-weight="600">◀ O(1) Scrub ▶</text>

      <path d="M415 84 L236 126" stroke="var(--diag-emerald)" stroke-width="2" stroke-dasharray="5 5" class="flow-pulse" />
      <path d="M415 84 L588 126" stroke="var(--diag-emerald)" stroke-width="2" stroke-dasharray="5 5" class="flow-pulse" />

      <rect x="68" y="126" width="330" height="82" rx="12" fill="var(--diag-node)" stroke="var(--diag-emerald)" stroke-opacity="0.65" />
      <text x="233" y="158" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">HiDPI Canvas 2D Projection</text>
      <text x="233" y="182" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11.5">Interpolated pointers, swap arcs &amp; PNG export</text>

      <rect x="422" y="126" width="330" height="82" rx="12" fill="var(--diag-node)" stroke="var(--diag-cyan)" stroke-opacity="0.65" />
      <text x="587" y="158" text-anchor="middle" fill="var(--text-primary)" font-family="var(--font-mono)" font-size="11.5" font-weight="700">Synchronized Code &amp; Stack</text>
      <text x="587" y="182" text-anchor="middle" fill="var(--text-secondary)" font-family="var(--font-sans)" font-size="11.5">Exact active source line + live variable watch</text>
    </svg>
  </div>
  <figcaption>${fa ? "شکل ۱: تولید اسنپ‌شات‌های تغییرناپذیر در CodeVis حرکت رو به عقب و جلو روی ۴۹ الگوریتم را در زمان O(1) ممکن می‌کند." : "Figure 1: Immutable step snapshots decouple algorithm execution from 60 FPS bidirectional scrubbing in CodeVis."}</figcaption>
</figure>`;
  },
};

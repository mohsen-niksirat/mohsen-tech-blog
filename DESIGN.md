# DESIGN.md: Mohsen Niksirat Engineering Journal (`mohsen-tech-blog`)

## 1. Visual World & Surface Mode
- **Identity:** *Archival Engineering Monograph* (inspired by technical print journals such as *Stripe Press*, *Increment*, and *MIT Press* monographs, adapted for bilingual English LTR and Persian RTL publishing).
- **Surface Mode:** **Read** (long-form technical comprehension, zero visual fatigue) paired with **Operate** (instant `Cmd/Ctrl + K` search palette, topic filtering, bilingual switching, and code inspection).
- **Anti-Reference:** Distinct from Mohsen's macOS Sonoma interactive desktop portfolio (`/Profile/`), and strictly avoids SaaS landing-page tropes (no purple-blue gradients, no 3-card feature grids, no eyebrow badges above `<h1>`, no fake terminal hero props).

## 2. Liveliness Dials
- **ENERGY: 2 (Editorial Authority)**: Typographic scale, hairline architectural rules, and bespoke geometric technical schematics carry the first viewport.
- **RHYTHM: 3 (Asymmetric Publication)**:
  1. Editorial Masthead & Publication Colophon Strip
  2. Two-Column Lead Monograph Spread (essay narrative + bespoke SVG architecture schematic)
  3. Filterable Chronological Essay Ledger (tabular numerals, reading time, series tags)
  4. Two-Column Engineering Field Notes (concise implementation dispatches)
- **MOTION: 2 (Physical, Sub-250ms)**:
  - GPU-composited reading progress hairline (`transform: scaleX(...)`)
  - Tactile button press (`transform: scale(0.97)` over `150ms cubic-bezier(0.23, 1, 0.32, 1)`)
  - `0ms` instant open on keyboard-triggered search (`Cmd/Ctrl + K` or `/`)
  - Full `prefers-reduced-motion: reduce` support

## 3. Typography (100% Self-Hosted Variable `.woff2`)
- **English Display & Essay Headings:** `Newsreader Variable` (optical-size literary serif that gives long-form engineering essays print-grade hierarchy).
- **English UI & Body Copy:** `Plus Jakarta Sans Variable` (`68ch` measure, `1.75` line-height for effortless sustained technical reading).
- **Persian (`فارسی` RTL) Display & Body:** `Vazirmatn Variable` (`1.88` line-height, native Persian numerals and Jalali calendar dates).
- **Code, CLI & Measurements:** `JetBrains Mono Variable` (used strictly for source code, JSON-RPC payloads, formulas, and tabular metadata; never as decorative headline styling).

## 4. Color Tokens & Verified WCAG 2.1 AA Contrast
Active palette uses 2 core neutral paper/slate surfaces + 1 signature burnt-vermilion editorial ink accent:

| Token | Light Mode (Archival Paper) | Dark Mode (Obsidian Slate) | Usage & Contrast Verification |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#FBF9F5` | `#131416` | Primary reading surface (avoids harsh `#FFF` glare and `#000` halation) |
| `--bg-surface` | `#F3EFE7` | `#1B1D21` | Code blocks, callouts, TOC, and Field Note inset panels |
| `--bg-elevated` | `#FFFFFF` | `#23262C` | Search command palette and floating toast |
| `--text-primary` | `#181614` | `#EDE9E2` | Primary ink (`16.8:1` Light / `15.1:1` Dark, AAA) |
| `--text-secondary` | `#4E4942` | `#B8B2A7` | Excerpts & secondary prose (`8.2:1` Light / `8.9:1` Dark, AAA) |
| `--text-muted` | `#6B645C` | `#918B80` | Dates, reading times & captions (`5.3:1` Light / `5.5:1` Dark, AA) |
| `--accent` | `#B33E19` | `#F2825C` | Editorial vermilion ink links & active states (`5.6:1` Light / `7.1:1` Dark, AA) |
| `--accent-soft` | `#F6E5DF` | `#2D1F1A` | Text selection & active filter chip surface |
| `--border` | `#E3DCD0` | `#2A2E36` | Crisp `1px` structural hairlines |

## 5. One-Line Reasons for Major Decisions
- **Warm Paper (`#FBF9F5`) & Obsidian (`#131416`):** Reduces contrast halation during 10-minute technical reading sessions compared to pure white or pure black.
- **Burnt Vermilion Accent (`#B33E19` / `#F2825C`):** Echoes classical editorial rubrics and margin annotations while achieving >5.5:1 contrast in both themes.
- **Newsreader + Plus Jakarta Sans + Vazirmatn:** Pairs optical-size editorial authority on English titles with crisp technical legibility in body prose and native Persian RTL script.
- **Asymmetric Lead Spread + Tabular Ledger:** Distinguishes a flagship deep-dive monograph from chronological essays and short field notes without resorting to uniform card grids.
- **Authored Geometric Inline SVGs:** Visualizes real system topologies (AI gateway failover, FSRS memory stability curves, browser-local AST/repo pipelines) that adapt automatically to Light and Dark tokens.
- **Zero-Dependency Static HTML Build (`scripts/build.mjs`):** Compiles Markdown essays into fast, SEO-indexed static HTML, RSS, JSON search index, and Sitemap for instant GitHub Pages serving with `.nojekyll`.

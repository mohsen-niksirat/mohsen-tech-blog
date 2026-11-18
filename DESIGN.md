# DESIGN.md: Mohsen Niksirat Engineering Publication (`mohsen-tech-blog`)

## 1. Visual World & Surface Mode
- **Identity:** *Obsidian Studio Engineering Publication* (inspired by technical digital monographs and developer engineering labs, combining rich atmospheric dark chrome with crisp editorial typography, real software screenshots, and live interactive simulations — plus full parity in *Warm Editorial Paper* Light Mode).
- **Surface Mode:** **Experience + Read + Operate**:
  - **First Viewport (`Experience`):** Layered editorial showcase framing a real shipped product interface (`9router` / `Repodest` / `Readner`) alongside Mohsen's portrait (`avatar.webp`) and a subtle interactive architecture preview.
  - **Monographs (`Read`):** `68ch` optimal reading measure, Optical-size `Newsreader` + `Plus Jakarta Sans` (and native `Vazirmatn` for Persian RTL), sticky Table of Contents, font scaling (`A- / A / A+`), and interactive simulators inside the diagrams.
  - **Tooling (`Operate`):** Instant `⌘K` / `/` bilingual full-text search, view mode switch (`Visual Grid | Compact Ledger`), topic filtering, lightbox zoom, and copyable highlighted code blocks.

## 2. Liveliness Dials
- **ENERGY: 3 (Visual & Architectural Presence):** Framed real application screenshots, masked coordinate backdrop in the hero stage, signature Signal Coral/Vermilion primary ink paired with Telemetry Cyan on live vector schematics.
- **RHYTHM: 3 (Asymmetric Editorial Magazine):**
  1. Masked Studio Hero with Interactive Multi-System Preview Frame
  2. Lead Monograph Interactive Split (Failover Topology Simulator + Essay Narrative)
  3. Visual Essay Showcase Grid (`16:10` real screenshots, toggleable to Compact Ledger)
  4. Shipped Systems 2x2 Visual Gallery (`Repodest`, `Horde Survival 3D`, `SpeakAI Coach`, `DataLens`)
  5. Two-Column Engineering Field Notes
- **MOTION: 2 (Physical, Sub-250ms):**
  - GPU `scaleX` reading progress hairline
  - Subtle hover image zoom (`scale(1.03)` over `220ms cubic-bezier(0.23, 1, 0.32, 1)`) behind `@media (hover: hover) and (pointer: fine)`
  - Tactile button press (`transform: scale(0.97)`)
  - Animated SVG telemetry wire pulses on technical diagrams (paused automatically under `prefers-reduced-motion: reduce`)
  - `0ms` keyboard modal open (`⌘K`) per raycast/command craft rules

## 3. Color Palette & WCAG 2.1 AA Compliance
Palette holds 2 neutral studio surface tiers + 1 primary signature accent (Signal Coral/Vermilion) + 1 technical telemetry accent (Cyan):

| Token | Obsidian Studio (Default Dark) | Warm Paper (Light) | Verified Contrast |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#0B0E14` | `#F7F4ED` | Primary backdrop |
| `--bg-surface` | `#131822` | `#EDE8DE` | Cards, diagrams, code frames |
| `--bg-elevated` | `#1A2130` | `#FFFFFF` | Modals & elevated frames |
| `--text-primary` | `#F1EFEA` | `#161513` | > 14:1 (AAA) |
| `--text-secondary` | `#B5BAC5` | `#47433E` | > 7.8:1 (AAA) |
| `--text-muted` | `#9BA3B5` | `#5F5951` | > 5.0:1 (AA on surface & elevated) |
| `--accent` | `#FF784E` | `#B33610` | > 4.9:1 (AA) |
| `--accent-ink` | `#0B0E14` | `#FFFFFF` | > 5.4:1 on solid accent CTA |
| `--diag-cyan` | `#38BDF8` | `#0369A1` | > 5.3:1 on `--diag-node` |
| `--diag-emerald` | `#34D399` | `#047857` | > 4.8:1 on `--diag-node` |
| `--diag-rose` | `#FB7185` | `#BE123C` | > 4.9:1 on `--diag-node` |
| `--diag-amber` | `#FBBF24` | `#B45309` | > 4.6:1 on `--diag-node` |
| `--diag-violet` | `#C084FC` | `#6D28D9` | > 5.2:1 on `--diag-node` |

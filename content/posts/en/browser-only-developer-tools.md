---
slug: browser-only-developer-tools
title: "Zero-Backend Developer Tools: Analyzing Repos and Datasets Entirely in the Browser"
date: 2026-10-29
topic: Local-First Web
tags: [Local-First, Browser Architecture, GitHub API, Privacy, Accessibility]
summary: "Architectural lessons from building Repodest, DataLens, and A11y Inspector so developers can inspect codebases, chart sensitive CSVs, and audit WCAG compliance with zero server uploads."
diagram: local-first-pipeline
featured: false
projectName: "Repodest · DataLens · A11y Inspector"
projectRepo: "https://github.com/mohsen-niksirat/Repodest"
projectLive: "https://mohsen-niksirat.github.io/Repodest/"
---

Developers have grown rightfully skeptical of pasting internal CSV exports, HTML staging dumps, or repository trees into random web utilities. Every unnecessary backend introduces three costs at once: server hosting bills, latency round-trips, and data-privacy risk.

Across three of my open-source web tools, **[Repodest](https://mohsen-niksirat.github.io/Repodest/)** (GitHub repository analyzer and LLM prompt packer), **[DataLens](https://mohsen-niksirat.github.io/DataLens/)** (multi-format tabular workbench), and **[A11y Inspector](https://mohsen-niksirat.github.io/A11y-Inspector/)** (WCAG 2.2 accessibility auditor), I pushed a strict architectural constraint: **zero application backend, zero telemetry, and 100% in-browser execution.**

{{DIAGRAM}}

## Single-Trip Repository Indexing with Git Trees

A naive client-side GitHub explorer recursively calls `/repos/{owner}/{repo}/contents/{path}` for every directory. On a medium TypeScript monorepo with 40 subdirectories, that burns 41 of GitHub's 60 unauthenticated hourly REST requests in two seconds.

Repodest avoids recursive traversal completely by resolving the default branch SHA once and requesting the flat Git tree with `?recursive=1`:

```javascript
export async function fetchRepoTreeSingleTrip(owner, repo, token = "") {
  const headers = { Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!metaRes.ok) throw new Error(`GitHub API ${metaRes.status}`);
  const meta = await metaRes.json();

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${meta.default_branch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  const { tree, truncated } = await treeRes.json();

  return { meta, blobs: tree.filter((node) => node.type === "blob"), truncated };
}
```

With two HTTP requests total, Repodest receives every file path and byte size in the repository. From that single manifest, it computes a 0–100 repository health score (checking documentation, CI workflows, license presence, test ratios, and lockfile hygiene) without downloading a single source file until the user selects specific files for LLM packing.

## Token-Aware Prompt Packing for LLMs

Dumping an entire repository into an LLM context window wastes tokens on lockfiles, minified bundles, SVG paths, and build artifacts. Repodest scores files by structural signal (prioritizing entrypoints, schemas, READMEs, and core modules while auto-excluding `package-lock.json`, `dist/`, `.min.js`, and binary assets) and estimates token cost live before copying:

```javascript
const NOISE_PATTERNS = [
  /(^|\/)(node_modules|dist|build|vendor|\.next|coverage)\//i,
  /\.(lock|min\.js|min\.css|map|png|jpg|webp|woff2?|ico|pdf)$/i,
  /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|Cargo\.lock)$/i,
];

export function shouldIncludeInDigest(path, sizeBytes, maxBytes = 120_000) {
  if (sizeBytes > maxBytes) return false;
  return !NOISE_PATTERNS.some((rx) => rx.test(path));
}

// Fast heuristic (~3.8 chars/token for code) for instant UI budget bars
export function estimateCodeTokens(text) {
  return Math.ceil(text.length / 3.8);
}
```

When shipped inside **Repodest-Extension** (Chrome Manifest V3), the same engine runs directly as an isolated overlay on `github.com/*/*` pages, turning any repository tab into a one-click Markdown context brief.

## Zero-Upload Data & Accessibility Auditing

The same local-first pattern powers **DataLens** and **A11y Inspector**:

* **DataLens** parses CSV, JSON, YAML, XML, SQL `INSERT` dumps, and Excel sheets directly via `FileReader` and `ArrayBuffer` streams, inferring column types (numeric, ISO date, categorical, nullable) to render sortable tables and vector SVG charts without uploading sensitive financial or analytics exports.
* **A11y Inspector** parses pasted or dropped HTML inside an inert `DOMParser` document (`new DOMParser().parseFromString(html, "text/html")`) so untrusted scripts never execute while WCAG contrast formulas, heading hierarchy checks (`h1` through `h6`), form label bindings, and ARIA role validations run synchronously in both the PWA and the companion Node.js CI CLI.

## Designing Honest Local-First UX

When an app runs purely on the client, users cannot *see* the absence of a server unless the interface communicates it clearly. Explicit offline badges, working Airplane-Mode support via Service Workers, and clean empty/error states (such as showing exact GitHub rate-limit reset times when unauthenticated quotas run dry) turn a technical constraint into immediate user trust.

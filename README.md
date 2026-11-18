# Mohsen Niksirat · Engineering Monograph (`mohsen-tech-blog`)

Bilingual (**English LTR** & **Persian RTL**) engineering publication and lab notebook hosted at **[mohsen-niksirat.github.io/mohsen-tech-blog](https://mohsen-niksirat.github.io/mohsen-tech-blog/)** (Persian edition: **[/mohsen-tech-blog/fa/](https://mohsen-niksirat.github.io/mohsen-tech-blog/fa/)**).

## Highlights
- **Archival Monograph Typography:** 100% self-hosted variable `.woff2` fonts (`Newsreader` optical size, `Plus Jakarta Sans`, `JetBrains Mono`, and `Vazirmatn` for Persian with Jalali dates).
- **Verified Light & Dark Themes:** Warm Archival Paper (`#FBF9F5`) and Obsidian Slate (`#131416`) with zero flash on load and WCAG 2.1 AA contrast across every token.
- **Zero-Dependency Static Compiler (`scripts/build.mjs`):** Compiles Markdown essays, build-time syntax highlighting, authored geometric SVG system diagrams, sticky Table of Contents, RSS 2.0 feeds (`feed.xml` & `fa/feed.xml`), `sitemap.xml`, and a bilingual `⌘K` instant search index in `< 200ms`.

## Writing a New Post
1. Add a Markdown file in `content/posts/en/<slug>.md` and `content/posts/fa/<slug>.md`.
2. Run locally with `node scripts/build.mjs` (or push straight to `master` and `.github/workflows/build-blog.yml` rebuilds the static HTML automatically).

## Links
- **Interactive macOS / iOS Portfolio:** [mohsen-niksirat.github.io/Profile](https://mohsen-niksirat.github.io/Profile/)
- **GitHub:** [@mohsen-niksirat](https://github.com/mohsen-niksirat)
- **Telegram:** [@mohsenniksirat](https://t.me/mohsenniksirat)

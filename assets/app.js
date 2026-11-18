// Progressive enhancement for Mohsen Niksirat's Engineering Journal.
// Zero external dependencies; handles theme persistence, reading progress,
// font scaling, TOC tracking, code copying, topic filtering, and Cmd/Ctrl+K search.

(function () {
  const docEl = document.documentElement;
  const isFa = docEl.lang === "fa";
  const BASE = "/mohsen-tech-blog";

  // 1. Toast helper
  let toastTimer = null;
  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2400);
  }

  // 2. Theme Toggle (Light Archival Paper <-> Dark Obsidian Slate)
  const themeBtns = document.querySelectorAll("[data-theme-toggle]");
  function syncThemeAria() {
    const dark = docEl.getAttribute("data-theme") === "dark";
    themeBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dark));
      const label = isFa
        ? dark ? "تغییر به پوسته روشن" : "تغییر به پوسته تاریک"
        : dark ? "Switch to light paper theme" : "Switch to dark slate theme";
      btn.setAttribute("aria-label", label);
    });
  }
  syncThemeAria();

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = docEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
      docEl.setAttribute("data-theme", next);
      try {
        localStorage.setItem("mtb-theme", next);
      } catch (_) {}
      syncThemeAria();

      // Sync Utterances iframe if loaded
      const frame = document.querySelector("iframe.utterances-frame");
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage(
          { type: "set-theme", theme: next === "dark" ? "github-dark" : "github-light" },
          "https://utteranc.app"
        );
      }
    });
  });

  // 3. Mobile Navigation Drawer
  const menuBtn = document.querySelector("[data-mobile-menu-btn]");
  const drawer = document.getElementById("mobile-drawer");
  if (menuBtn && drawer) {
    menuBtn.addEventListener("click", () => {
      const open = drawer.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }

  // 4. Reading Progress Hairline (GPU scaleX)
  const progressEl = document.querySelector(".reading-progress");
  const articleEl = document.querySelector(".prose");
  if (progressEl && articleEl) {
    let ticking = false;
    const updateProgress = () => {
      const rect = articleEl.getBoundingClientRect();
      const total = Math.max(1, articleEl.offsetHeight - window.innerHeight * 0.6);
      const passed = Math.min(total, Math.max(0, -rect.top + window.innerHeight * 0.2));
      progressEl.style.transform = `scaleX(${(passed / total).toFixed(4)})`;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(updateProgress);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateProgress();
  }

  // 5. Article Font-Size Switcher (sm / md / lg)
  const sizeBtns = document.querySelectorAll("[data-font-scale]");
  if (sizeBtns.length) {
    const applySize = (val) => {
      if (val === "md") docEl.removeAttribute("data-font-size");
      else docEl.setAttribute("data-font-size", val);
      sizeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fontScale === val)));
      try {
        localStorage.setItem("mtb-font-size", val);
      } catch (_) {}
    };
    let savedSize = "md";
    try {
      savedSize = localStorage.getItem("mtb-font-size") || "md";
    } catch (_) {}
    applySize(savedSize);
    sizeBtns.forEach((b) => b.addEventListener("click", () => applySize(b.dataset.fontScale)));
  }

  // 6. Sticky TOC IntersectionObserver
  const tocLinks = [...document.querySelectorAll(".toc-list a")];
  if (tocLinks.length && "IntersectionObserver" in window) {
    const targets = tocLinks
      .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
      .filter(Boolean);
    const setActive = (id) => {
      tocLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${id}`));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
    );
    targets.forEach((t) => observer.observe(t));
  }

  // 7. Copy Code & Copy Article Link Buttons
  document.querySelectorAll("[data-copy-code]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const code = btn.closest(".code-block")?.querySelector("pre code")?.textContent || "";
      try {
        await navigator.clipboard.writeText(code);
        const orig = btn.textContent;
        btn.textContent = isFa ? "کپی شد ✓" : "Copied ✓";
        setTimeout(() => {
          btn.textContent = orig;
        }, 1600);
      } catch (_) {}
    });
  });

  document.querySelectorAll("[data-copy-url]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast(isFa ? "لینک مقاله در کلیپ‌بورد کپی شد" : "Article link copied to clipboard");
      } catch (_) {}
    });
  });

  // 8. Topic Filter Tabs on Essay Ledger (with Empty State & Reset)
  const filterTabs = [...document.querySelectorAll("[data-topic-filter]")];
  const ledgerRows = [...document.querySelectorAll("[data-essay-topic]")];
  const emptyBox = document.getElementById("ledger-empty");
  const resetBtn = document.querySelector("[data-reset-filter]");

  function applyTopicFilter(topic) {
    filterTabs.forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.topicFilter === topic)));
    let shown = 0;
    ledgerRows.forEach((row) => {
      const match = topic === "all" || row.dataset.essayTopic === topic;
      row.hidden = !match;
      if (match) shown++;
    });
    if (emptyBox) emptyBox.hidden = shown > 0;
  }

  if (filterTabs.length) {
    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => applyTopicFilter(tab.dataset.topicFilter));
    });
    if (resetBtn) resetBtn.addEventListener("click", () => applyTopicFilter("all"));
  }

  // 9. On-Demand GitHub Discussions / Utterances Comments (zero third-party script until requested)
  const loadCommentsBtn = document.querySelector("[data-load-comments]");
  if (loadCommentsBtn) {
    loadCommentsBtn.addEventListener("click", () => {
      const container = document.getElementById("comments-mount");
      if (!container) return;
      loadCommentsBtn.disabled = true;
      loadCommentsBtn.textContent = isFa ? "در حال بارگذاری دیدگاه‌ها..." : "Loading GitHub Discussions...";
      const s = document.createElement("script");
      s.src = "https://utteranc.app/client.js";
      s.async = true;
      s.crossOrigin = "anonymous";
      s.setAttribute("repo", "mohsen-niksirat/mohsen-tech-blog");
      s.setAttribute("issue-term", "pathname");
      s.setAttribute(
        "theme",
        docEl.getAttribute("data-theme") === "dark" ? "github-dark" : "github-light"
      );
      s.onload = () => loadCommentsBtn.remove();
      s.onerror = () => {
        loadCommentsBtn.disabled = false;
        loadCommentsBtn.textContent = isFa
          ? "خطا در اتصال به گیت‌هاب؛ تلاش مجدد"
          : "Could not reach GitHub; click to retry";
      };
      container.appendChild(s);
    });
  }

  // 10. Bilingual Search Engine (Modal Cmd/Ctrl+K + Dedicated /search/ Page)
  let searchCache = null;
  let searchPromise = null;

  function fetchIndex() {
    if (searchCache) return Promise.resolve(searchCache);
    if (!searchPromise) {
      searchPromise = fetch(`${BASE}/search-index.json`)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          searchCache = data;
          return data;
        })
        .catch((err) => {
          searchPromise = null;
          throw err;
        });
    }
    return searchPromise;
  }

  function rankEntries(entries, rawQuery) {
    const q = rawQuery.trim().toLowerCase();
    const pool = entries.filter((item) => item.lang === (isFa ? "fa" : "en") || q.length >= 2);
    if (!q) return entries.filter((item) => item.lang === (isFa ? "fa" : "en")).slice(0, 8);

    const terms = q.split(/\s+/).filter(Boolean);
    return pool
      .map((item) => {
        const title = item.title.toLowerCase();
        const summary = item.summary.toLowerCase();
        const tags = item.tags.join(" ").toLowerCase();
        const body = item.body.toLowerCase();
        let score = 0;
        for (const term of terms) {
          if (title.includes(term)) score += 12;
          if (tags.includes(term)) score += 7;
          if (summary.includes(term)) score += 4;
          if (body.includes(term)) score += 1;
        }
        if (score > 0 && item.lang === (isFa ? "fa" : "en")) score += 2;
        return { item, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.item);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // Modal setup
  const backdrop = document.getElementById("search-backdrop");
  const dialogInput = document.getElementById("search-modal-input");
  const dialogList = document.getElementById("search-modal-results");
  let activeIdx = 0;

  function renderDialogList(items) {
    if (!dialogList) return;
    if (!items.length) {
      dialogList.innerHTML = `<li class="dialog-state">${
        isFa ? "مقاله یا یادداشتی با این عبارت پیدا نشد." : "No matching essays or field notes found."
      }</li>`;
      return;
    }
    activeIdx = 0;
    dialogList.innerHTML = items
      .map(
        (it, i) => `<li class="dialog-item">
          <a href="${escapeHtml(it.url)}" data-active="${i === 0}">
            <span class="dialog-item-title">${escapeHtml(it.title)}</span>
            <span class="dialog-item-sub">${escapeHtml(it.topic)} · ${escapeHtml(it.readTime)}</span>
          </a>
        </li>`
      )
      .join("");
  }

  async function openSearchModal() {
    if (!backdrop || !dialogInput || !dialogList) return;
    backdrop.hidden = false;
    dialogInput.focus();
    dialogList.innerHTML = `<li class="dialog-state">${
      isFa ? "در حال بارگذاری نمایه جستجو..." : "Loading search index..."
    }</li>`;
    try {
      const idx = await fetchIndex();
      renderDialogList(rankEntries(idx, dialogInput.value));
    } catch (_) {
      dialogList.innerHTML = `<li class="dialog-state">${
        isFa ? "خطا در دریافت نمایه جستجو. لطفاً صفحه را رفرش کنید." : "Could not load search index. Please refresh and try again."
      }</li>`;
    }
  }

  function closeSearchModal() {
    if (!backdrop) return;
    backdrop.hidden = true;
  }

  document.querySelectorAll("[data-open-search]").forEach((btn) => {
    btn.addEventListener("click", openSearchModal);
  });

  document.querySelectorAll("[data-close-search]").forEach((btn) => {
    btn.addEventListener("click", closeSearchModal);
  });

  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeSearchModal();
    });
  }

  if (dialogInput) {
    dialogInput.addEventListener("input", async () => {
      try {
        const idx = await fetchIndex();
        renderDialogList(rankEntries(idx, dialogInput.value));
      } catch (_) {}
    });

    dialogInput.addEventListener("keydown", (e) => {
      const links = [...(dialogList?.querySelectorAll(".dialog-item a") || [])];
      if (!links.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIdx = (activeIdx + 1) % links.length;
        links.forEach((a, i) => a.setAttribute("data-active", String(i === activeIdx)));
        links[activeIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIdx = (activeIdx - 1 + links.length) % links.length;
        links.forEach((a, i) => a.setAttribute("data-active", String(i === activeIdx)));
        links[activeIdx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && links[activeIdx]) {
        e.preventDefault();
        window.location.href = links[activeIdx].href;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (backdrop && !backdrop.hidden) closeSearchModal();
      else openSearchModal();
    } else if (
      e.key === "/" &&
      backdrop &&
      backdrop.hidden &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === "Escape" && backdrop && !backdrop.hidden) {
      closeSearchModal();
    }
  });

  // Dedicated /search/ page input
  const pageSearchInput = document.getElementById("page-search-input");
  const pageSearchOut = document.getElementById("page-search-results");
  if (pageSearchInput && pageSearchOut) {
    const runPageSearch = async () => {
      pageSearchOut.innerHTML = `<div class="empty-state"><p>${
        isFa ? "در حال بارگذاری نمایه..." : "Loading index..."
      }</p></div>`;
      try {
        const idx = await fetchIndex();
        const matches = rankEntries(idx, pageSearchInput.value);
        if (!matches.length) {
          pageSearchOut.innerHTML = `<div class="empty-state"><p>${
            isFa ? "نتیجه‌ای برای عبارت واردشده یافت نشد." : "No essays or notes matched your query."
          }</p></div>`;
          return;
        }
        pageSearchOut.innerHTML = `<ul class="essay-ledger">${matches
          .map(
            (m) => `<li class="ledger-row">
              <div class="ledger-date tabular">
                <span>${escapeHtml(m.dateLabel)}</span>
                <span class="ledger-readtime">${escapeHtml(m.readTime)}</span>
              </div>
              <div class="ledger-main">
                <h3><a href="${escapeHtml(m.url)}">${escapeHtml(m.title)}</a></h3>
                <p>${escapeHtml(m.summary)}</p>
              </div>
              <div class="ledger-topic">${escapeHtml(m.topic)}</div>
            </li>`
          )
          .join("")}</ul>`;
      } catch (_) {
        pageSearchOut.innerHTML = `<div class="empty-state"><p>${
          isFa ? "خطا در بارگذاری نمایه جستجو." : "Failed to load search index."
        }</p></div>`;
      }
    };
    pageSearchInput.addEventListener("input", runPageSearch);
    runPageSearch();
  }
})();

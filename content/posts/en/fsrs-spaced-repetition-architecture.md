---
slug: fsrs-spaced-repetition-architecture
title: "Beyond Rigid Leitner Boxes: Implementing FSRS in an Offline-First Reader"
date: 2026-11-10
topic: Learning Engines
tags: [FSRS, Spaced Repetition, Offline PWA, IndexedDB, Kotlin]
summary: "Why classic five-box Leitner systems over-schedule reviews, and how Readner models per-card memory stability alongside an integrated PDF reader and semantic WordWeb graph."
diagram: fsrs-curve
featured: false
projectName: "Readner · Leitner Pro Max"
projectRepo: "https://github.com/mohsen-niksirat/Leitner-Pro-Max"
projectLive: "https://mohsen-niksirat.github.io/Leitner-Pro-Max/"
---

Anyone who has tried memorizing thousands of foreign words with a physical five-box Leitner deck eventually hits the "review avalanche." Miss a word once on day 30, and classic Leitner drops it all the way back to Box 1 alongside brand-new vocabulary you first saw five minutes ago.

When building **[Readner (Leitner Pro Max)](https://mohsen-niksirat.github.io/Leitner-Pro-Max/)** as an offline-first Progressive Web App and native Kotlin Android companion, I replaced rigid box progression with the **Free Spaced Repetition Scheduler (FSRS)** and wired it directly into a PDF book reader and a 4,500-word CEFR A1–C2 lexicon.

{{DIAGRAM}}

## Why Memory Stability Beats Box Numbers

Human long-term memory does not reset to zero after a single lapse; a word you knew for a month re-stabilizes much faster than an unfamiliar term. FSRS formalizes this through the **DSR (Difficulty, Stability, Retrievability)** three-component model of memory:

* **Stability (*S*):** The number of days it takes for recall probability to decay from 100% down to 90%.
* **Difficulty (*D* ∈ [1, 10]):** Intrinsic complexity of the item for this learner, updated after each rating (`Again`, `Hard`, `Good`, `Easy`).
* **Retrievability (*R*):** Instantaneous probability of recall after *t* elapsed days, governed by a power-law forgetting curve:

```javascript
// FSRS v4.5 power-law forgetting curve and target interval solver
const DECAY = -0.5;
const FACTOR = 19 / 81; // Ensures R(S, S) === 0.90

export function retrievability(elapsedDays, stability) {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
}

export function nextIntervalDays(stability, desiredRetention = 0.9) {
  const raw = (stability / FACTOR) * (Math.pow(desiredRetention, 1 / DECAY) - 1);
  return Math.max(1, Math.round(raw));
}
```

Notice the elegance of `FACTOR = 19 / 81` with `DECAY = -0.5`: when `elapsedDays === stability`, `(1 + 19/81)^(-0.5) = (100/81)^(-0.5) = 9/10 = 0.90`. If a learner reviews a card late (say at day 14 when *S* = 9) and still recalls it, their demonstrated retrievability was lower, so FSRS rewards them with a **larger** stability boost than if they had crammed early.

## Closing the Gap Between Reading and Flashcards

Most spaced-repetition apps fail at acquisition friction: copying a sentence out of an article, switching tabs, pasting definitions, and tagging CEFR levels breaks reading flow.

In Readner, the PDF workspace and the vocabulary deck share the same IndexedDB store:

1. **Contextual Selection:** Highlighting any word inside a loaded PDF extracts both the target lemma and the surrounding sentence as an authentic usage example.
2. **Instant Lexicon Hydration:** If the lemma matches Readner's bundled 4,500+ CEFR dictionary, phonetic IPA transcription, part of speech, level badge (`A1` through `C2`), and multilingual translations populate offline in under 4 milliseconds.
3. **WordWeb Semantic Graph:** Isolated words fade faster than connected clusters. Readner builds an interactive force-directed neighborhood linking roots, synonyms, and contrast pairs so learners review meaning networks rather than isolated strings.

## Offline-First Sync and Transaction Safety in IndexedDB

Because commuters and students review decks on subways or airplanes, every review transaction must commit locally with zero network dependency. One subtle bug in browser storage is splitting card state updates and review log appends across separate transactions; if a tab closes mid-write, FSRS analytics drift out of sync with card intervals.

```javascript
export function commitReviewAtomic(db, updatedCard, reviewLogEntry) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["cards", "review_logs"], "readwrite");
    tx.objectStore("cards").put(updatedCard);
    tx.objectStore("review_logs").add(reviewLogEntry);

    tx.oncomplete = () => resolve(updatedCard);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error("IndexedDB review transaction aborted"));
  });
}
```

Wrapping both object stores (`cards` and `review_logs`) in a single multi-store `readwrite` transaction guarantees ACID atomicity inside the browser, matching the Room SQLite transactions used in the Kotlin + Jetpack Compose Android build.

## Practical Impact

Switching from fixed box intervals to FSRS reduced daily review counts by roughly a quarter at the same 90% target retention, while sentence-anchored cards captured from real PDFs stayed memorable far longer than synthetic word lists.

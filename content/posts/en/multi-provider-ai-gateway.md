---
slug: multi-provider-ai-gateway
title: "Designing a Resilient Multi-Provider AI Gateway on Serverless Runtimes"
date: 2026-11-16
topic: AI Systems
tags: [AI Gateway, Serverless, Load Balancing, Telegram Mini App, Cryptography]
summary: "How 9router and AIDahl pool keys across Gemini, Groq, DeepSeek, OpenAI, and OpenRouter with sub-20ms automatic HTTP 429 failover, per-user AES-GCM vaults, and rate-safe Telegram token streaming."
diagram: gateway-topology
featured: true
projectName: "9router AI Gateway & AIDahl"
projectRepo: "https://github.com/mohsen-niksirat/9router_TG_Bot"
projectLive: "https://github.com/mohsen-niksirat/AIDahl"
---

When you ship an AI assistant to real daily users, the hardest problems rarely come from prompt engineering. They come from upstream reliability: sudden `HTTP 429` rate limits on free or burst tiers, regional latency spikes, provider outages, and the security liability of storing user-supplied API keys.

While building **[9router](https://github.com/mohsen-niksirat/9router_TG_Bot)** (a multi-provider AI gateway and Telegram Mini App) alongside **[AIDahl](https://github.com/mohsen-niksirat/AIDahl)** (a Bring-Your-Own-Key Telegram research assistant), I needed a routing layer that could treat five distinct model ecosystems (Gemini, Groq, DeepSeek, OpenAI, and OpenRouter) as a single fault-tolerant compute pool.

{{DIAGRAM}}

## Why Single-Provider Wrappers Break Under Real Traffic

Most chat bots wire user input straight to a single SDK endpoint. That works during a solo demo, then fails in three predictable ways once concurrent users arrive:

1. **Token-per-minute (TPM) cliffs:** A single long-context document summary can exhaust a key's per-minute token bucket, blocking every short query behind it.
2. **Heterogeneous payload dialects:** Gemini's native multimodal content parts differ from OpenAI-compatible `chat/completions` schemas, especially around vision attachments and tool calls.
3. **Downstream chat throttling:** Even when Groq streams 400 tokens per second, forwarding every chunk to Telegram's `editMessageText` endpoint triggers a strict flood-wait penalty from Telegram itself.

Solving all three meant separating **key health state**, **protocol normalization**, and **stream pacing** into independent layers.

## Health-Weighted Key Pooling and 429 Circuit Breaking

Instead of static round-robin rotation, 9router maintains a lightweight health record per key. When an upstream request returns `429 Too Many Requests` or `503 Service Unavailable`, the router parses `Retry-After` headers (falling back to an exponential cooldown with random jitter) and immediately retries the request against the next healthy credential or fallback provider.

```javascript
export async function dispatchWithFailover(pool, payload, maxAttempts = 4) {
  const now = Date.now();
  const candidates = pool
    .filter((key) => key.cooldownUntil <= now)
    .sort((a, b) => a.ewmaLatencyMs - b.ewmaLatencyMs);

  let lastError = null;

  for (const key of candidates.slice(0, maxAttempts)) {
    const started = performance.now();
    try {
      const response = await callNormalizedProvider(key, payload);
      const elapsed = performance.now() - started;
      key.ewmaLatencyMs = key.ewmaLatencyMs * 0.75 + elapsed * 0.25;
      key.failures = 0;
      return response;
    } catch (err) {
      lastError = err;
      if (err.status === 429 || err.status >= 500) {
        const baseMs = err.retryAfterMs ?? Math.min(60_000, 4_000 * 2 ** key.failures);
        const jitterMs = Math.floor(Math.random() * 1_500);
        key.failures += 1;
        key.cooldownUntil = Date.now() + baseMs + jitterMs;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`All healthy upstream candidates exhausted: ${lastError?.message}`);
}
```

Adding random jitter (`0–1500ms`) prevents synchronized retry storms when multiple serverless workers wake up after a shared one-minute quota window resets.

## Per-User BYOK Encryption with AES-GCM

Both AIDahl and 9router support Bring-Your-Own-Key (BYOK) workflows so power users can attach personal OpenRouter or Gemini keys without sharing rate limits. Storing raw bearer tokens in a database table is unacceptable: if a read replica or log dump ever leaks, every user's billing account is exposed.

To isolate credentials, each user's key is encrypted before persistence using authenticated **AES-256-GCM** with a unique 96-bit initialization vector (IV) and a per-user derived key:

```javascript
import { webcrypto as crypto } from "node:crypto";

export async function sealUserApiKey(masterSecret, telegramUserId, rawApiKey) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(masterSecret),
    "HKDF",
    false,
    ["deriveKey"]
  );

  const userKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: enc.encode(`uid:${telegramUserId}`),
      info: enc.encode("9router-byok-v1"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    userKey,
    enc.encode(rawApiKey)
  );

  return {
    iv: Buffer.from(iv).toString("base64"),
    ciphertext: Buffer.from(cipherBuf).toString("base64"),
  };
}
```

Using HKDF bound to the immutable `telegramUserId` ensures that ciphertext copied from one user row cannot be decrypted under another user's context, and GCM's authentication tag rejects any tampered payload immediately.

## Pacing SSE Streams Inside Telegram's Rate Limits

Server-Sent Events (SSE) from modern inference engines emit 30 to 120 chunks per second. Calling Telegram's `editMessageText` on every token immediately trips a `429 Too Many Requests: retry after N` block on the chat.

In AIDahl, an adaptive coalescing buffer solves this cleanly:

* **Time-and-character Dual Gate:** Flush an update only when at least `650ms` have elapsed *and* at least `48` new characters have accumulated, or when the stream finishes.
* **Markdown Fence Balancing:** Before sending an intermediate edit, count unclosed triple-backtick fences (` ``` `). Temporarily appending a closing fence keeps code blocks formatted smoothly while the model is still mid-function.
* **Graceful Final Commit:** The final edit strips the temporary cursor indicator and attaches inline action buttons (model badge, token usage, retry, or branch thread).

## Takeaways for Serverless AI Tooling

Treating LLM providers like ephemeral spot instances rather than infallible RPC endpoints completely changes user perception. When a Gemini key hits a burst ceiling and DeepSeek or Groq picks up the request in under 20 milliseconds, the user simply gets their answer without ever seeing a traceback.

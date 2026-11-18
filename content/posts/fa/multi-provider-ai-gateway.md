---
slug: multi-provider-ai-gateway
title: "معماری درگاه چندسرویس‌دهنده هوش مصنوعی با Failover خودکار روی بستر Serverless"
date: 2026-11-16
topic: سیستم‌های هوش مصنوعی
tags: [درگاه AI, Serverless, توزیع بار, مینی‌اپ تلگرام, رمزنگاری]
summary: "چگونه در 9router و AIDahl کلیدهای Gemini، Groq، DeepSeek، OpenAI و OpenRouter با جایگزینی خودکار زیر ۲۰ میلی‌ثانیه هنگام خطای ۴۲۹، رمزنگاری AES-GCM و استریم ایمن تلگرام مدیریت می‌شوند."
diagram: gateway-topology
featured: true
projectName: "درگاه 9router و دستیار AIDahl"
projectRepo: "https://github.com/mohsen-niksirat/9router_TG_Bot"
projectLive: "https://github.com/mohsen-niksirat/AIDahl"
---

وقتی یک محصول هوش مصنوعی را از مرحله دمو به استفاده روزمره کاربران واقعی می‌برید، دشوارترین چالش‌ها دیگر مهندسی پرامپت نیستند؛ بلکه پایداری سرویس‌های بالادستی است: خطاهای ناگهانی `HTTP 429` روی سهمیه‌های دقیقه‌ای، نوسان تأخیر منطقه‌ای، قطعی موقت سرورها و مسئولیت امنیتی نگهداری کلیدهای شخصی کاربران (BYOK).

در جریان ساخت **[9router](https://github.com/mohsen-niksirat/9router_TG_Bot)** (درگاه چندسرویس‌دهنده هوش مصنوعی و مینی‌اپ تلگرام) و **[AIDahl](https://github.com/mohsen-niksirat/AIDahl)** (دستیار پژوهشی تلگرام بر پایه کلید شخصی کاربر)، به لایه‌ای نیاز داشتم که پنج اکوسیستم متفاوت (Gemini، Groq، DeepSeek، OpenAI و OpenRouter) را به یک استخر پردازشی واحد و مقاوم در برابر خطا تبدیل کند.

{{DIAGRAM}}

## چرا اتصال مستقیم به یک سرویس‌دهنده زیر بار واقعی از کار می‌افتد؟

اغلب بات‌ها و ابزارهای ساده، ورودی کاربر را مستقیماً به یک کلید و یک نقطه اتصال می‌فرستند. این الگو در تست تکی عالی کار می‌کند، اما با ورود کاربران همزمان در سه نقطه متوقف می‌شود:

1. **اشباع سقف توکن در دقیقه (TPM):** خلاصه‌سازی یک سند بلند توسط یک کاربر می‌تواند کل سهمیه دقیقه‌ای کلید را مصرف کند و ده‌ها پیام کوتاه بعدی را با خطای `429` روبه‌رو سازد.
2. **تفاوت ساختار پیام‌ها:** فرمت بخش‌های چندرسانه‌ای و تصاویر در API بومی Gemini با استاندارد `chat/completions` در OpenAI و OpenRouter تفاوت دارد.
3. **محدودیت نرخ ویرایش پیام در تلگرام:** حتی اگر Groq بتواند ۴۰۰ توکن در ثانیه استریم کند، فراخوانی مستقیم `editMessageText` برای هر تکه متن بلافاصله باعث مسدودیت موقت ربات توسط سرور تلگرام می‌شود.

راهکار مهندسی، تفکیک کامل **وضعیت سلامت کلیدها**، **یکسان‌سازی پروتکل** و **تنظیم آهنگ استریم** در سه لایه مستقل بود.

## چرخش هوشمند کلیدها و مدارقطع‌کن خطای ۴۲۹

به‌جای نوبت‌دهی کورکورانه (Round-Robin ساده)، موتور 9router برای هر کلید یک رکورد سلامت و میانگین متحرک تأخیر نگه می‌دارد. به محض دریافت کد وضعیت `429` یا خطاهای سری `5xx`، هدر `Retry-After` خوانده شده (یا بازه استراحت نمایی همراه با Jitter تصادفی محاسبه می‌شود) و درخواست در همان لحظه روی کلید یا سرویس‌دهنده سالم بعدی اجرا می‌گردد:

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

افزودن مقدار تصادفی `jitterMs` جلوی هجوم همزمان (Thundering Herd) ورکرهای Serverless را دقیقاً در لحظه صفر شدن پنجره یک‌دقیقه‌ای سهمیه‌ها می‌گیرد.

## ایزوله‌سازی کلیدهای شخصی کاربران با رمزنگاری AES-GCM

در معماری BYOK، هر کاربر می‌تواند کلید اختصاصی خودش را ثبت کند. ذخیره متنی کلیدهای API در دیتابیس یک ریسک امنیتی جدی است. برای محافظت کامل، کلید هر کاربر پیش از ذخیره با الگوریتم احرازهویت‌شده **AES-256-GCM** و کلید مشتق‌شده اختصاصی از شناسه تغییرناپذیر کاربر (`HKDF-SHA256`) رمزنگاری می‌شود:

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

به لطف نمک اختصاصی `uid:${telegramUserId}`، حتی کپی شدن متن رمزنگاری‌شده از رکورد یک کاربر به رکورد دیگر قابل رمزگشایی نخواهد بود و تگ صحت GCM هرگونه دستکاری بایت‌ها را فوراً رد می‌کند.

## کنترل نرخ استریم زنده در تلگرام

برای نمایش روان پاسخ‌های استریم بدون برخورد با محدودیت Flood-Wait تلگرام، در AIDahl از یک بافر تجمیع هوشمند استفاده کردم:

* **شرط دوگانه زمان و حجم:** پیام فقط زمانی ویرایش می‌شود که حداقل `650` میلی‌ثانیه از ویرایش قبلی گذشته باشد و دست‌کم `48` کاراکتر تازه تولید شده باشد.
* **بستن موقت بلوک‌های کد:** اگر مدل در میانه نوشتن بلوک کد (` ``` `) باشد، پیش از ارسال هر ویرایش میانی تعداد بک‌تیک‌های باز شمارش شده و به‌طور موقت بسته می‌شود تا قالب‌بندی پیام در تلگرام به هم نریزد.

## جمع‌بندی

نگاه به سرویس‌دهنده‌های مدل زبانی به‌عنوان منابع ناپایدار ابری (مشابه Spot Instance) تجربه کاربری را زیر و رو می‌کند: وقتی سهمیه یک کلید پر می‌شود و درخواست در کمتر از ۲۰ میلی‌ثانیه روی سرویس‌دهنده جایگزین ادامه پیدا می‌کند، کاربر نهایی فقط یک دستیار سریع و همیشه‌در‌دسترس را تجربه خواهد کرد.

---
slug: browser-only-developer-tools
title: "ابزارهای توسعه‌دهنده بدون سرور: تحلیل مخزن‌های گیت‌هاب و داده‌ها کاملاً درون مرورگر"
date: 2026-10-29
topic: وب محلی و حریم خصوصی
tags: [Local-First, معماری مرورگر, GitHub API, حریم خصوصی, دسترس‌پذیری]
summary: "تجربه‌های معماری از ساخت Repodest، DataLens و A11y Inspector برای تحلیل کدبیس، مصورسازی فایل‌های داده حساس و ممیزی دسترس‌پذیری وب بدون ارسال حتی یک بایت به سرور."
diagram: local-first-pipeline
featured: false
projectName: "Repodest · DataLens · A11y Inspector"
projectRepo: "https://github.com/mohsen-niksirat/Repodest"
projectLive: "https://mohsen-niksirat.github.io/Repodest/"
---

توسعه‌دهندگان حق دارند نسبت به آپلود خروجی‌های CSV سازمانی، کدهای HTML محیط تست یا ساختار مخزن‌های کاری در ابزارهای آنلاین ناشناس محتاط باشند. هر سرور واسط غیرضروری همزمان سه هزینه ایجاد می‌کند: هزینه نگهداری زیرساخت، تأخیر رفت‌وبرگشت شبکه و ریسک افشای داده.

در طراحی سه ابزار متن‌باز **[Repodest](https://mohsen-niksirat.github.io/Repodest/)** (تحلیلگر مخزن گیت‌هاب و بسته‌بندی پرامپت برای مدل‌های زبانی)، **[DataLens](https://mohsen-niksirat.github.io/DataLens/)** (میزکار تحلیل و تبدیل فرمت‌های داده) و **[A11y Inspector](https://mohsen-niksirat.github.io/A11y-Inspector/)** (ممیزی دسترس‌پذیری استاندارد WCAG 2.2)، یک محدودیت سخت‌گیرانه تعیین کردم: **صفر سرور بک‌اند، صفر تله‌متری و اجرای ۱۰۰٪ درون مرورگر کاربر.**

{{DIAGRAM}}

## دریافت کل درخت مخزن گیت‌هاب تنها با یک درخواست

یک پیاده‌سازی ساده برای نمایش پوشه‌های گیت‌هاب معمولاً مسیر `/repos/{owner}/{repo}/contents/{path}` را به شکل بازگشتی برای هر پوشه صدا می‌زند. روی یک پروژه متوسط با ۴۰ زیرپوشه، این کار ۴۱ درخواست از سهمیه ۶۰تایی ساعتانه GitHub API بدون توکن را در دو ثانیه می‌سوزاند.

در Repodest به جای پیمایش پوشه‌به‌پوشه، شاخه پیش‌فرض یک‌بار خوانده شده و کل درخت فایل‌ها با پارامتر `?recursive=1` در یک فراخوانی دریافت می‌شود:

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

تنها با دو درخواست HTTP، فهرست کامل مسیرها و حجم تمام فایل‌های مخزن آماده است. بر همین اساس امتیاز سلامت ۰ تا ۱۰۰ مخزن (بررسی مستندات، پایپ‌لاین CI، مجوز انتشار، نسبت تست‌ها و بهداشت فایل‌های قفل) محاسبه می‌شود و محتوای متنی فایل‌ها فقط زمانی دانلود می‌گردد که کاربر آن‌ها را برای ساخت پرامپت انتخاب کند.

## هرس هوشمند فایل‌های کم‌ارزش و بودجه‌بندی توکن

کپی کردن خام تمام فایل‌های یک پروژه در پنجره متنی ChatGPT یا Claude بخش بزرگی از ظرفیت توکن را صرف `package-lock.json`، باندل‌های فشرده و فایل‌های گرافیکی می‌کند. در Repodest فایل‌های نویز به‌طور خودکار کنار گذاشته می‌شوند و تخمین لحظه‌ای مصرف توکن پیش از کپی نمایش داده می‌شود:

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

export function estimateCodeTokens(text) {
  return Math.ceil(text.length / 3.8);
}
```

همین موتور در افزونه مرورگر **Repodest-Extension** (مبتنی بر Manifest V3 کروم) مستقیماً روی صفحات `github.com` باز می‌شود تا بدون ترک مخزن، خلاصه مهندسی کدها آماده ارسال به مدل هوش مصنوعی باشد.

## پارس ایمن داده و DOM در DataLens و A11y Inspector

همین الگوی پردازش محلی در دو ابزار دیگر نیز به‌کار رفته است:

* **DataLens** فایل‌های CSV، JSON، YAML، XML، خروجی SQL و شیت‌های Excel را مستقیماً در حافظه مرورگر پارس کرده، نوع داده هر ستون را تشخیص می‌دهد و نمودارهای برداری SVG و آمار توصیفی را بدون خروج داده از سیستم کاربر ترسیم می‌کند.
* **A11y Inspector** کد HTML ورودی را درون یک سند غیرفعال `DOMParser` بارگذاری می‌کند تا هیچ اسکریپت ناامنی اجرا نشود و سپس نسبت کنتراست رنگ‌ها، ترتیب تگ‌های تیتر (`h1` تا `h6`)، برچسب فرم‌ها و صفات ARIA را هم در نسخه وب و هم در ابزار CLI پایپ‌لاین‌های CI ارزیابی می‌کند.

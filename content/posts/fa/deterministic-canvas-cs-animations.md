---
slug: deterministic-canvas-cs-animations
title: "آموزش بصری الگوریتم‌ها با موتور Canvas تک‌فایلی: نگاهی به معماری CodeVis"
date: 2026-09-22
topic: سیستم‌های یادگیری
tags: [HTML5 Canvas, الگوریتم‌ها, آموزش علوم کامپیوتر, بدون وابستگی, معماری نرم‌افزار]
summary: "چگونه در CodeVis چهل‌ونه مفهوم علوم کامپیوتر، هایلایت همگام خطوط کد و خروجی کارت‌های آموزشی را در یک فایل HTML مستقل و آفلاین پیاده‌سازی کردم."
diagram: canvas-timeline
featured: false
projectName: "CodeVis"
projectRepo: "https://github.com/mohsen-niksirat/CodeVis"
projectLive: "https://mohsen-niksirat.github.io/CodeVis/"
---

بیشتر شبیه‌سازهای آموزشی الگوریتم در یکی از دو تله می‌افتند: یا ویدیویی از پیش ضبط‌شده پخش می‌کنند که امکان دستکاری متغیرها را ندارد، یا درون حلقه‌های `setTimeout` مستقیماً عناصر DOM را تغییر می‌دهند که به محض زدن دکمه «گام قبلی» وضعیت برنامه به‌هم می‌ریزد.

هنگام ساخت **[CodeVis](https://mohsen-niksirat.github.io/CodeVis/)** برای آموزش بصری ۴۹ مبحث علوم کامپیوتر (از مرتب‌سازی، پیمایش گراف و درخت‌ها تا برنامه‌نویسی پویا، شبکه و الگوهای طراحی)، دو اصل معماری را مبنا قرار دادم: **حرکت دوطرفه آنی بین گام‌ها** و **تک‌فایلی بودن کامل بدون هیچ وابستگی خارجی**.

{{DIAGRAM}}

## جداسازی اجرای الگوریتم از رندر گرافیکی با نوار اسنپ‌شات

تمیزترین روش برای برگشت‌پذیر کردن هر الگوریتم این است که هرگز داخل خود الگوریتم انیمیشن اجرا نکنیم. در عوض، الگوریتم یک‌بار به‌طور کامل روی ورودی کوچک (`N ≤ 32`) اجرا شده و آرایه‌ای از **اسنپ‌شات‌های تغییرناپذیر (Step Tape)** تولید می‌کند:

```javascript
export function recordBinarySearch(sortedArray, target) {
  const tape = [];
  let low = 0;
  let high = sortedArray.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const value = sortedArray[mid];

    tape.push({
      line: 4,
      vars: { low, mid, high, probe: value, target },
      highlights: { range: [low, high], pivot: mid },
      caption: `Probe index ${mid} (value ${value}) against target ${target}.`,
    });

    if (value === target) {
      tape.push({
        line: 6,
        vars: { low, mid, high, foundAt: mid },
        highlights: { found: mid },
        caption: `Target ${target} matched at index ${mid}.`,
      });
      return tape;
    }

    if (value < target) low = mid + 1;
    else high = mid - 1;
  }

  tape.push({ line: 11, vars: { low, high, foundAt: -1 }, highlights: {}, caption: "Target absent." });
  return tape;
}
```

وقتی آرایه `tape` ساخته شد، رابط پخش‌کننده به یک تابع خالص `render(tape[stepIndex])` تبدیل می‌شود:

* دکمه **گام به عقب** صرفاً متغیر `stepIndex` را یک واحد کم می‌کند و هیچ باگی در وضعیت آرایه‌ها رخ نمی‌دهد.
* جابه‌جایی نوار زمان (Scrubber) در زمان `O(1)` به هر فریم دلخواه می‌پرد.
* پنل کد دقیقاً خط `tape[stepIndex].line` و مقادیر لحظه‌ای متغیرها را همگام با شکل روی بوم Canvas هایلایت می‌کند.

## وضوح بالا روی نمایشگرهای Retina و مقیاس کسری ویندوز

متن‌های تار روی لپ‌تاپ‌های ویندوزی با مقیاس ۱۲۵٪ یا ۱۵۰٪ خوانایی دیاگرام‌های فنی را از بین می‌برد. با ضرب کردن ابعاد واقعی بوم در `window.devicePixelRatio` و حفظ مختصات منطقی در واحد پیکسل CSS، تمام برچسب‌های گره‌ها و فلش‌ها کاملاً شارپ رندر می‌شوند:

```javascript
export function resizeHiDpiCanvas(canvas, logicalWidth, logicalHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(logicalWidth * dpr);
  canvas.height = Math.round(logicalHeight * dpr);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}
```

از آنجا که هر گام به‌صورت قطعی روی `<canvas>` ترسیم می‌شود، افزودن قابلیت **ذخیره کارت آموزشی PNG با یک کلیک** (`canvas.toBlob()`) کمتر از بیست خط کد نیاز داشت تا دانشجو بتواند از هر لحظه الگوریتم فلش‌کارت تصویری باکیفیت خروجی بگیرد.

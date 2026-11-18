---
slug: inspecting-mcp-servers-visually
title: "کالبدشکافی پروتکل MCP: ساخت محیط بصری تست و اشکال‌زدایی ابزارهای هوش مصنوعی"
date: 2026-10-05
topic: سیستم‌های هوش مصنوعی
tags: [پروتکل MCP, JSON-RPC, TypeScript, ابزار توسعه‌دهنده, ایجنت AI]
summary: "نگاهی به معماری MCP Studio: تبدیل اسکیمای JSON و ترافیک خام JSON-RPC 2.0 به یک محیط گرافیکی تعاملی در مرورگر برای تست سرورهای Model Context Protocol."
diagram: mcp-jsonrpc
featured: false
projectName: "MCP Studio"
projectRepo: "https://github.com/mohsen-niksirat/Mcp-Studio"
projectLive: "https://mohsen-niksirat.github.io/Mcp-Studio/"
---

با گسترش استاندارد **Model Context Protocol (MCP)** در ایجنت‌های کدنویسی و دستیارهای دسکتاپ، توسعه‌دهندگان بک‌اند با نسل جدیدی از سرورها روبه‌رو شده‌اند که کاربر اصلی آن‌ها انسان نیست، بلکه مدل زبانی است. وقتی فراخوانی یک ابزار با خطا مواجه می‌شود، خواندن لاگ‌های خام `stdio` یا پیام‌های متنی JSON زمان زیادی می‌گیرد تا مشخص شود ایراد از اسکیمای Zod است، از نوع ورودی‌ها یا از مرحله Handshake اولیه.

پروژه **[MCP Studio](https://mohsen-niksirat.github.io/Mcp-Studio/)** را ساختم تا تجربه کاربری ابزارهایی مثل Postman و GraphQL Playground را به دنیای MCP بیاورم: اتصال مستقیم به سرور، مشاهده فهرست ابزارها و منابع، تولید خودکار فرم تست از روی `inputSchema` و ردیابی دقیق بسته‌های JSON-RPC 2.0.

{{DIAGRAM}}

## ساختار مذاکره اولیه (Handshake) در پروتکل MCP

در زیر لایه‌های SDK، پروتکل MCP بر پایه JSON-RPC 2.0 کار می‌کند. پیش از اجرای هر ابزاری، کلاینت و سرور نسخه پروتکل و قابلیت‌های فعال (`tools`، `resources` و `prompts`) را ردوبدل می‌کنند:

```typescript
export interface JsonRpcRequest<T = unknown> {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: T;
}

export async function negotiateMcpSession(send: (msg: JsonRpcRequest) => Promise<any>) {
  const initResult = await send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-03-26",
      capabilities: { roots: { listChanged: false } },
      clientInfo: { name: "mcp-studio", version: "1.0.0" },
    },
  });

  const [toolsRes, resourcesRes, promptsRes] = await Promise.allSettled([
    initResult.capabilities?.tools ? send({ jsonrpc: "2.0", id: 2, method: "tools/list" }) : null,
    initResult.capabilities?.resources ? send({ jsonrpc: "2.0", id: 3, method: "resources/list" }) : null,
    initResult.capabilities?.prompts ? send({ jsonrpc: "2.0", id: 4, method: "prompts/list" }) : null,
  ]);

  return { initResult, toolsRes, resourcesRes, promptsRes };
}
```

نمایش شفاف شیء `capabilities` در لحظه اتصال یکی از خطاهای رایج را بلافاصله آشکار می‌کند: تعریف توابع ابزار در کد بدون اعلام `capabilities: { tools: {} }` در پاسخ `initialize`.

## تبدیل خودکار JSON Schema به فرم‌های تعاملی

هر ابزار در MCP دارای یک `inputSchema` استاندارد است. به جای تایپ دستی JSON در هر نوبت تست، MCP Studio درخت اسکیما را به کنترل‌های فرم دسترس‌پذیر تبدیل می‌کند و همزمان تب JSON خام را همگام نگه می‌دارد:

* فیلدهای `string` دارای `enum` به منوی انتخابی `<select>` و رشته‌های معمولی به ورودی متنی همراه با توضیحات `description` تبدیل می‌شوند.
* فیلدهای `number` و `integer` محدوده `minimum` و `maximum` را کنترل می‌کنند.
* فیلدهای `boolean` با کلید تغییر وضعیت صفحه‌کلیدپذیر نمایش داده می‌شوند.

این نمای بصری یک فایده مهم دیگر هم دارد: هر جا نام پارامتر یا توضیح `description` برای انسان گنگ باشد، مدل زبانی هم در مقداردهی آن دچار خطا خواهد شد. اصلاح اسکیما در MCP Studio مستقیماً دقت فراخوانی ابزار توسط ایجنت را بالا می‌برد.

## تفکیک خطای پروتکل از خطای منطقی ابزار

در استاندارد MCP تفاوت مهمی میان **خطای سطح پروتکل JSON-RPC** (مثل `-32602 Invalid params` در کلید `error`) و **خطای اجرای ابزار** (بازگشت نتیجه درون `result` همراه با پرچم `isError: true` برای خوداصلاحی مدل زبانی) وجود دارد. در جدول ترافیک MCP Studio این دو حالت با رنگ‌بندی و ساختار متمایز نمایش داده می‌شوند تا اشکال‌زدایی سرور در چند ثانیه انجام شود.

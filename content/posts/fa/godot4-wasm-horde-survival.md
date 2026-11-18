---
slug: godot4-wasm-horde-survival
title: "اجرای ۶۰ فریم بازی بقای سه‌بعدی در مرورگر: چالش‌های خروجی WebAssembly در Godot 4"
date: 2026-10-18
topic: معماری سیستم و بازی‌سازی
tags: [Godot 4, WebAssembly, WebGL, شبکه مکانی, معماری بازی]
summary: "چگونه در Horde Survival 3D صدها دشمن سه‌بعدی، حلقه‌های پرتابه و باس چندفازی را درون بودجه ۱۶.۶ میلی‌ثانیه‌ای مرورگر نگه داشتم؛ به‌همراه مقایسه عملی با Unity و Kotlin."
diagram: wasm-spatial-grid
featured: false
projectName: "Horde Survival 3D"
projectRepo: "https://github.com/mohsen-niksirat/Horde_Survival_3D_Godot"
projectLive: "https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/"
---

اجرای مستقیم روی سیستم‌عامل دسکتاپ بسیاری از سربارهای تخصیص حافظه را پنهان می‌کند؛ اما وقتی همان صحنه سه‌بعدی را به **WebAssembly و WebGL 2** کامپایل می‌کنید تا کاربر با یک کلیک روی GitHub Pages بازی کند، هر برخورد فیزیکی اضافه، ساخت نود جدید برای گلوله‌ها یا کامپایل دیرهنگام شیدر بلافاصله به شکل لگ و افت فریم دیده می‌شود.

پروژه **[Horde Survival 3D](https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/)** بخشی از یک سه‌گانه مهندسی شخصی است که در آن مکانیک‌های سبک بقای روگ‌لایت را موازی در سه پشته **Godot 4 (تحت وب سه‌بعدی)**، **Unity (با C#)** و **اندروید نیتیو (Kotlin دوبعدی)** پیاده‌سازی کردم. برای قفل شدن نرخ فریم نسخه وب روی ۶۰ فریم بر ثانیه، سه بخش اصلی موتور برخورد، چرخه عمر اشیاء و پیش‌گرمایش شیدرها را بازطراحی کردم.

{{DIAGRAM}}

## جایگزینی فیزیک سنگین سه‌بعدی با شبکه هش مکانی (Spatial Grid)

در اوج موج‌های بازی، بیش از ۲۵۰ دشمن همزمان به سمت بازیکن حرکت می‌کنند و تیغه‌های چرخان و پرتابه‌های انفجاری از میان آن‌ها عبور می‌کنند. استفاده از `CharacterBody3D` و تابع `move_and_slide()` برای تک‌تک دشمنان باعث می‌شود موتور فیزیک در هر فریم هزاران برخورد کپسولی سه‌بعدی را حل کند.

از آنجا که منطق گیم‌پلی روی صفحه افقی $XZ$ جریان دارد، جداسازی دشمنان و تشخیص اصابت پرتابه‌ها را به یک شبکه مکانی یکنواخت با بررسی مجذور فاصله منتقل کردم:

```gdscript
class_name SpatialGrid
extends RefCounted

var cell_size: float = 4.0
var buckets: Dictionary = {}

func clear() -> void:
    buckets.clear()

func _key(pos: Vector3) -> int:
    var cx := int(floor(pos.x / cell_size))
    var cz := int(floor(pos.z / cell_size))
    return (cx << 16) ^ (cz & 0xFFFF)

func insert(enemy_id: int, pos: Vector3) -> void:
    var k := _key(pos)
    if not buckets.has(k):
        buckets[k] = PackedInt32Array()
    buckets[k].append(enemy_id)

func query_radius(origin: Vector3, radius: float, positions: PackedVector3Array) -> PackedInt32Array:
    var hits := PackedInt32Array()
    var r_sq := radius * radius
    var base_x := int(floor(origin.x / cell_size))
    var base_z := int(floor(origin.z / cell_size))

    for dx in range(-1, 2):
        for dz in range(-1, 2):
            var k := ((base_x + dx) << 16) ^ ((base_z + dz) & 0xFFFF)
            if not buckets.has(k):
                continue
            for id in buckets[k]:
                if origin.distance_squared_to(positions[id]) <= r_sq:
                    hits.append(id)
    return hits
```

فشرده‌سازی مختصات سلول در یک عدد صحیح ۳۲ بیتی از ساخت رشته‌های موقت در هر فریم جلوگیری می‌کند و استفاده از `distance_squared_to` عملیات ریشه‌گیری (جذر) را کاملاً حذف می‌نماید.

## استخر اشیاء (Object Pooling) برای پرتابه‌ها و کریستال‌های امتیاز

ساخت و حذف مداوم نودها با `instantiate()` و `queue_free()` در موج‌های شلوغ باعث پرش زمان فریم می‌شود. با پیش‌تخصیص آرایه ثابتی از پرتابه‌ها، آیتم‌های XP و اعداد آسیب در ابتدای بارگذاری صحنه، شلیک هر گلوله به یک جابه‌جایی شاخص $O(1)$ تبدیل شد و مصرف حافظه از دقیقه اول تا مبارزه با باس سه‌فازی کاملاً خطی و ثابت باقی ماند.

## حذف مکث کامپایل شیدر در WebGL 2

در مرورگرها، شیدرهای WebGL 2 معمولاً اولین باری که یک متریال یا افکت ذره‌ای وارد کادر دوربین می‌شود کامپایل می‌گردند و مکثی حدود ۱۲۰ میلی‌ثانیه ایجاد می‌کنند. با قرار دادن یک نوار مخفی پیش‌گرمایش پشت منوی شروع (شامل نمونه‌های کوچک از متریال‌های انفجار و هاله سلاح‌ها)، کامپایل شیدرها پیش از شروع موج اول انجام می‌شود.

## مقایسه عملی Godot 4، Unity و Kotlin

تجربه ساخت یک ژانر واحد در سه محیط نشان داد:

* **Godot 4** سریع‌ترین چرخه نمونه‌سازی و سبک‌ترین خروجی WebAssembly را دارد، به شرطی که برای انبوه دشمنان به سراغ ساختارهای داده سبک بروید.
* **Unity C#** در مدیریت ساختارهای داده پیوسته قدرتمند است، اما حجم بارگذاری اولیه وب بالاتری دارد.
* **Kotlin دوبعدی نیتیو** روی موبایل کمترین مصرف باتری و سریع‌ترین زمان اجرا را فراهم می‌کند.

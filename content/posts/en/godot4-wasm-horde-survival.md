---
slug: godot4-wasm-horde-survival
title: "60 FPS Swarm Survival on the Web: Exporting Godot 4 3D Roguelites to WebAssembly"
date: 2026-10-18
topic: Systems & Game Dev
tags: [Godot 4, WebAssembly, WebGL, Spatial Hashing, Game Architecture]
summary: "How Horde Survival 3D sustains hundreds of active 3D enemies, evolving projectile rings, and boss phases inside a browser WASM budget, plus lessons from parallel Unity and Kotlin builds."
diagram: wasm-spatial-grid
featured: false
projectName: "Horde Survival 3D"
projectRepo: "https://github.com/mohsen-niksirat/Horde_Survival_3D_Godot"
projectLive: "https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/"
---

Desktop game engines forgive a surprising amount of allocation sloppiness. Compile that exact same 3D scene to **WebAssembly and WebGL 2** for instant browser play on GitHub Pages, and every extra physics query, per-bullet node instantiation, or uncached shader variant immediately shows up as a dropped frame.

**[Horde Survival 3D](https://mohsen-niksirat.github.io/Horde_Survival_3D_Godot/)** is part of a personal game-engineering trilogy where I implemented wave-survival roguelite mechanics across **Godot 4 (GDScript / 3D Web)**, **Unity (C#)**, and **Android (Kotlin 2D)** to compare engine ergonomics under heavy entity counts. Getting the 3D Web build locked at 60 FPS required rethinking three subsystems: collision broadphase, object lifetimes, and WebGL material warm-up.

{{DIAGRAM}}

## Replacing Full 3D Physics Bodies with Spatial Hash Grids

In a horde roguelite, 250+ enemies converge continuously on the player while orbital blades, area pulses, and ricochet projectiles sweep through the crowd. Attaching a full `CharacterBody3D` with `move_and_slide()` to every enemy forces the 3D physics server to resolve thousands of convex capsule contacts per frame.

Because combat takes place on a mostly planar arena ($XZ$ plane with visual height variation), enemy separation and projectile hit detection only need 2D uniform spatial hashing with squared-distance checks:

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

Packing cell coordinates into a single 32-bit integer key avoids string allocations (`"%d,%d"`), and checking `distance_squared_to` skips square-root calls until an actual hit occurs.

## Zero-Allocation Ring Buffers for Projectiles and XP Gems

Spawning and freeing scene-tree nodes (`instantiate()` + `queue_free()`) during late-game waves creates frame-time spikes when hundreds of XP crystals and damage numbers appear simultaneously.

Pre-allocating fixed pools at scene boot (for projectiles, XP pickups, and floating combat text) turns spawning into an $O(1)$ index increment. Inactive instances simply toggle `visible = false` and park outside the camera frustum, keeping memory flat from minute one through the three-phase boss encounter.

## Eliminating First-Hit Shader Stutter in WebGL 2

Even with fast simulation code, WebGL 2 compiles shader permutations lazily the first time a material + light + particle combination enters the camera view. Without preparation, the first boss shockwave or evolved weapon aura causes a noticeable 120ms hitch.

Rendering a hidden 1-frame warm-up strip behind the title screen (containing one tiny quad of each particle material and emission shader) forces the browser's ANGLE / WebGL pipeline to compile programs before Wave 1 starts.

## Cross-Engine Perspective: Godot 4 vs Unity vs Kotlin

Building variations of the same genre across three stacks highlighted clear boundaries:

* **Godot 4** won decisively on iteration speed and lightweight WebAssembly export size, provided you step around heavy 3D physics nodes for swarm entities.
* **Unity C#** offered strong burst/struct data locality out of the box, at the cost of heavier project scaffolding and slower cold web loads.
* **Native Kotlin 2D** started instantaneously on mobile hardware with minimal battery draw, proving that custom canvas/sprite loops remain tough to beat for pure 2D arcade responsiveness.

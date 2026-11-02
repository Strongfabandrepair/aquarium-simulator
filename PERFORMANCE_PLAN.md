# ReefSim Performance & Visual Improvement Plan

## Codebase Architecture Summary

| Layer | Module | Responsibility |
|-------|--------|---------------|
| **Orchestration** | `GameEngine.js` | `setInterval` tick loop + state mutation dispatch |
| **Rendering** | `ThreeRenderer.js` | WebGL context, scene graph, per-frame animation |
| **Procedural Meshes** | `LivestockRenderer.js` | Fish/coral geometry + skeletal animation |
| **Environment** | `TankBuilder.js` | Static scene (stand, glass, sand, rocks, equipment) |
| **Textures** | `TextureGenerator.js` | Canvas-based procedural textures with cache |
| **UI** | `UIController.js` | DOM diffing via `innerHTML` comparison |
| **State** | `ObservableStore.js` | Deep Proxy reactive store |
| **Simulation** | `WaterChemistry.js`, `LivestockEngine.js`, `StoreService.js` | Physics/biology/math models |

---

## Part A: Latency Improvements

### A1. Decouple Simulation Tick from Render Loop [CRITICAL]

**Problem:** `GameEngine.tick()` runs synchronously inside `setInterval`. At speed=20 (50ms interval), if `render()` takes >50ms, intervals stack up. `onResize()` is called every tick even though the canvas hasn't resized.

**Fix:**
- Extract `requestAnimationFrame`-based render loop independent of `setInterval`.
- `setInterval` only advances simulation state.
- RAF loop reads latest state and calls `renderer.render()`.
- Only call `onResize()` from `window.resize` event handler, not per-frame.

**Files:** `GameEngine.js` (startLoop, tick, render), `ThreeRenderer.js` (render → remove onResize call)

---

### A2. Eliminate O(n) Mesh Lookups Per Tick [CRITICAL]

**Problem:** `ThreeRenderer.render()` calls `this.fishMeshes.find(m => m.userData.id === fish.id)` for **every fish, every tick**. With 10 fish, that's 10 linear scans per tick. Same for corals.

**Fix:**
- Maintain `Map<id, mesh>` for fish and corals.
- On livestock add: create mesh, add to Map.
- On livestock remove: remove from Map.
- In render loop: iterate state, Map.get(id) → O(1).

**Files:** `ThreeRenderer.js`

---

### A3. Optimize Bubble Particle System [HIGH]

**Problem:** 120 particles × 3 components iterated every tick. `Date.now()` called per-particle for sine offset. `needsUpdate = true` forces full GPU buffer re-upload regardless of whether particles actually moved.

**Fix:**
- Reduce to 60 particles (visual density is fine with size variation).
- Precompute per-particle speed multiplier in a `Float32Array`.
- Only set `needsUpdate = true` when animation is active.
- Mark geometry attribute with `THREE.DynamicDrawHint`.
- Pass single `time` timestamp from RAF loop instead of calling `Date.now()` per-fish and per-coral.

**Files:** `ThreeRenderer.js` (bubble init + animation)

---

### A4. Remove Duplicate Fish Eyes [MEDIUM]

**Problem:** Lines 610-616 in `LivestockRenderer.js` unconditionally add generic eyes to ALL fish. Clownfish, yellowTang, tailspotBlenny, banggaiCardinal already have custom eyes. This causes:
- Z-fighting (two eyes at nearly same position)
- Extra draw calls per fish
- Visual glitches (eyes floating outside body for some species)

**Fix:**
- Skip generic eye block for species that define custom eyes: `['clownfish', 'yellowTang', 'tailspotBlenny', 'banggaiCardinal']`.

**Files:** `LivestockRenderer.js`

---

### A5. Throttle TankBuilder Signature Check [LOW-MEDIUM]

**Problem:** `TankBuilder.buildEnvironment()` calls `JSON.stringify(equipment)` with 13 keys every tick. The signature check itself is cheap but the serialization isn't free, and it runs every single tick regardless of whether equipment changed.

**Fix:**
- Subscribe to ObservableStore equipment changes; only run `buildEnvironment` when equipment signature actually changes.
- Cache `envSignature` as a simple string concatenation instead of `JSON.stringify`.

**Files:** `TankBuilder.js`, `ThreeRenderer.js`

---

### A6. Throttle Sparkline Redraws [LOW]

**Problem:** Sparklines redraw via `setTimeout(..., 0)` every tick. Each redraw involves canvas 2D context operations for 7 parameters.

**Fix:**
- Throttle to every 5 ticks (every ~250ms at 1x speed, still smooth visually).
- Only redraw if the data window actually changed.

**Files:** `UIController.js` (renderWaterParams), `SparklineManager.js`

---

### A7. Add Dirty-Flag to Store/Livestock HTML Re-renders [LOW]

**Problem:** `renderStore()` and `renderLivestock()` rebuild HTML every tick. `updateHTML()` compares `innerHTML === html` but price/ownership status can flip between ticks.

**Fix:**
- Only rebuild store HTML when equipment ownership or budget changes.
- Only rebuild livestock HTML when livestock/corals array length changes.
- Use ObservableStore subscriptions for targeted updates.

**Files:** `UIController.js`

---

## Part B: Visual & Rendering Improvements

### B1. Replace Water Material [HIGH]

**Problem:** `MeshPhysicalMaterial` with `transmission: 0.7` is expensive (extra render pass for transmission buffer). Transparency sorting issues cause fish behind glass to render incorrectly.

**Fix:**
- Replace with a custom `ShaderMaterial` for water surface:
  - Vertex shader: subtle sine-based ripple displacement on Y.
  - Fragment shader: Fresnel-based transparency + specular highlight from point light.
  - Add animated normal perturbation for surface ripples.
- Use a single flat plane at water surface instead of a full box volume.
- Set `transparent: true, depthWrite: false, side: THREE.FrontSide`.

**Files:** `ThreeRenderer.js` (new water shader setup)

---

### B2. Add Volumetric Light Shafts (God Rays) [HIGH]

**Problem:** Single point light + ambient creates flat lighting. No sense of the LED fixture casting light downward.

**Fix:**
- Add a cone geometry beneath the LED fixture with additive blending.
- Shader: radial falloff from center, animated noise for shimmer.
- Color matches light profile (reef = cool blue-white, basic = warm white).
- Flicker subtly to simulate realistic LED shimmer.

**Files:** `ThreeRenderer.js` (light shaft mesh + shader)

---

### B3. Add Caustics Pattern on Sand Bed [HIGH]

**Problem:** Flat sand material looks static and dead. No light interaction.

**Fix:**
- Pre-generate a caustics texture in `TextureGenerator` (concentric ring interference pattern).
- Apply to sand material as an emissive/overlay with animated UV offset.
- Animate UV offset slowly (0.001 per frame) for drifting caustics.
- Intensity scales with `state.equipment.lightOn`.

**Files:** `TextureGenerator.js` (new `causticsTexture`), `TankBuilder.js` (sand material)

---

### B4. Wet Specular on Fish [MEDIUM]

**Problem:** All fish use `MeshStandardMaterial` with roughness 0.3-0.7. They look matte/dry, not wet and slimy.

**Fix:**
- Switch hero fish (clownfish, tangs, mandarin) to `MeshPhysicalMaterial`:
  - `clearcoat: 1.0`
  - `clearcoatRoughness: 0.15`
  - `sheen: 0.3` for subsurface scattering illusion.
- Add subtle `emissive` for bioluminescent species (mandarinGoby, banggaiCardinal).

**Files:** `LivestockRenderer.js`

---

### B5. Fix Bubble Appearance [MEDIUM]

**Problem:** `PointsMaterial` renders square dots. No perspective sizing. All bubbles rise at identical speed.

**Fix:**
- Generate a circular sprite texture (radial gradient, transparent edges) in `TextureGenerator`.
- Use it as `PointsMaterial.map` with `alphaTest: 0.1`.
- Enable `sizeAttenuation: true` for perspective-correct scaling.
- Stagger bubble speeds (some fast, some slow) via precomputed speed array.

**Files:** `TextureGenerator.js`, `ThreeRenderer.js`

---

### B6. Reduce Fog Density [LOW]

**Problem:** `FogExp2(0x0a1628, 0.05)` is very dense — fish near tank edges fade into darkness.

**Fix:**
- Reduce density to `0.025`.
- Add slight blue tint to fog color matching ambient light.

**Files:** `ThreeRenderer.js` (init)

---

### B7. Improve Rock Geometry [LOW]

**Problem:** `DodecahedronGeometry(radius, 1)` has only 1 subdivision level. Rocks look faceted and angular.

**Fix:**
- Increase to `detail: 2` for smoother silhouette.
- Add a subtle vertex displacement noise function for more organic shape.
- Add coralline algae texture (purple mottled) for cycled tanks instead of flat purple.

**Files:** `TankBuilder.js`, `TextureGenerator.js`

---

### B8. Add Sand Bed Bump/Normal Variation [LOW]

**Problem:** Flat uniform sand color reads as plastic.

**Fix:**
- Generate a noise-based bump/roughness map for sand.
- Subtle vertex height variation (very slight) for natural unevenness.
- Vary sand color slightly based on substrate amount.

**Files:** `TankBuilder.js`, `TextureGenerator.js`

---

### B9. Fix Transparency Sorting for Fish Behind Glass [MEDIUM]

**Problem:** Water `depthWrite: false` + fish opaque materials can cause fish behind the glass to render in front of it or z-fight.

**Fix:**
- Set explicit `renderOrder` on fish/coral meshes (render after water).
- Water: `renderOrder = -1`.
- Fish: `renderOrder = 0` (default).
- Corals: `renderOrder = 0`.

**Files:** `ThreeRenderer.js`

---

## Part C: UI/UX Polish

### C1. CSS Transitions for Parameter Bars

**Fix:** Add `transition: width 0.3s ease, background-color 0.3s ease` to `.param-bar-fill` for smooth trend visualization.

**Files:** `styles.css`

---

### C2. Loading Overlay for Texture Generation

**Problem:** First render blocks main thread while ~30 canvas textures generate.

**Fix:**
- Show a loading overlay before `GameEngine.init()`.
- Pre-generate critical textures, then hide overlay and start game.

**Files:** `index.html`, `main.js`

---

### C3. Improve Welcome Screen Atmosphere

**Fix:**
- Subtle CSS parallax on background gradient.
- Fade-in animation on tank options.
- Animated wave/bubble background using CSS keyframes.

**Files:** `styles.css`

---

## Implementation Priority

| Phase | Items | Expected Impact |
|-------|-------|-----------------|
| **1. Latency Critical** | A1, A2, A3 | Eliminates jank, prevents interval stacking, reduces per-frame work by ~60% |
| **2. Visual High-Impact** | B1, B2, B3 | Transforms the scene from "tech demo" to "living reef" |
| **3. Latency Polish** | A4, A5, A6, A7 | Removes micro-stutters, reduces GC pressure |
| **4. Visual Polish** | B4, B5, B6, B7, B8, B9 | Adds realism and visual depth |
| **5. UI Polish** | C1, C2, C3 | Professional first impression |

**Total estimated LOC change:** ~800-1200 lines across 6-8 files.

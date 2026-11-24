# Nanoscale Revision — Build Brief

Nov 20, 2026 · @felix arkle

## Vision

Nanoscale Revision is a single-page 3D site where every concept in ELEC0031 is a physical place you can zoom into. Chapter 1 is the CMOS inverter from Topic 2, taken all the way down: wafer, die, inverter cell, transistor, gate oxide, silicon lattice.

Three interactions carry the whole experience:

1. **Semantic zoom.** Each scale is its own hidden layer. Zooming into an object hands over to the layer beneath with a continuous-feeling transition and a live scale bar (mm → µm → nm → Å).
2. **Click to inspect.** Every visible part is a named object. Clicking glides the camera to it and opens a panel: what it is, how it was made, what it does, and which lecture slide it comes from.
3. **Section planes that lock into place.** Dragging moves a cutting plane through the device. It snaps magnetically to the meaningful sections (the slide 27 dashed line through both transistors, along a gate, across the well), the two halves part slightly, and the cut face shows labelled doping regions.

The source of truth is the layout, not hand-made models. The inverter is defined as the six masks from slide 28 (n-well, polysilicon, n+, p+, contact, metal) plus a process recipe. A small process simulator builds the 3D structure step by step. The fab sequence (slides 29–45), every cross-section and the top-down layout are therefore always consistent, and later chapters only add new masks and recipes.

Who it's for: Felix first, as a revision tool for ELEC0031, then other students. It succeeds when someone can explain the inverter from silicon atoms up to the truth table by clicking through it, and the craft is good enough to submit to Awwwards or write up on Codrops.

## Tech: is three.js right?

Yes. Use three.js through React Three Fiber, on `WebGPURenderer` with its automatic WebGL 2 fallback. Every reference site below is three.js. WebGPU now ships in all major browsers, Safari included since September 2025 ([Utsubo](https://www.utsubo.com/blog/threejs-best-practices-100-tips)). And the hard part of this project is procedural geometry plus UI state, which suits code-first three.js far better than an editor-first engine.

| Option | Where it's strong | Why it isn't the core |
| --- | --- | --- |
| **three.js + R3F** | Largest creative-dev ecosystem; React UI and 3D share one state store | Chosen |
| Babylon.js | Full engine, built-in inspector and GUI | Heavier and more game-like; far fewer award-level editorial sites to learn from |
| PlayCanvas | Editor plus engine, good for game scenes | Editor-centric; geometry generated from masks fights the editor |
| Spline | Fastest route to a pretty scene | Can't generate geometry from a process recipe; little control over transitions and shaders |
| Raw WebGPU | Total control | Months of renderer work before any physics content |
| Unity / Unreal web export | Best tools for 3D artists | Multi-MB loads, poor text and accessibility, no DOM panels |

**Stack**

- Vite + React 19 + TypeScript, built as an SPA with one persistent canvas. Next.js adds nothing here, because there's no server work and route changes must never remount the canvas.
- `three` pinned to a single recent release. `WebGPURenderer` + TSL for custom materials (TSL compiles to WGSL or GLSL). Use three's own TSL post-processing, not the WebGL-only `postprocessing` package.
- `@react-three/fiber` v9 (stable; its `gl` prop accepts the async WebGPU renderer, see [Maxime Heckel's field guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)). Don't use v10: it's WebGPU-first but still alpha ([release notes](https://newreleases.io/project/npm/@react-three/fiber/release/10.0.0-alpha.6)).
- drei, but only renderer-agnostic helpers: `CameraControls`, `Html`, `Bvh`, `useGLTF`. Avoid its WebGL-only materials.
- GSAP for choreographed timelines, Zustand for app state, zod-validated content files, URL-driven navigation.
- Blender only for hero props (wafer, packaged die), exported as glTF with KTX2 textures. Everything inside the chip is generated in code.
- Vitest for the process simulator; Playwright screenshots for visual regression.

**Escape hatch.** If R3F's declarative model fights the render pipeline (several render targets, custom pass ordering), move the scene core to vanilla three behind a small imperative API, as the [Giulio portfolio](https://tympanus.net/codrops/?p=113157) did. Keep React for panels and routing. Design the scene layer from day one so this switch costs a day, not a rewrite.

## Inspiration board

Take the craft from the award sites and the teaching from the explorables. Most showcase 3D sites are portfolios with nothing to explain, and most explainers look plain. This project should be both. Study each one for the specific thing listed below, not for its overall look.

| Reference | What it is | Steal this |
| --- | --- | --- |
| [The Monolith Project](https://themonolithproject.net/) | A 13-scene R3F journey; [build write-up on Codrops](https://tympanus.net/codrops/2025/11/29/building-the-monolith-composable-rendering-systems-for-a-13-scene-webgl-epic/) | Composable materials, an outline pass and a scene-to-scene transition system. That's the backbone of our scale layers |
| [Jesse Zhou's Ramen Shop](https://www.jesse-zhou.com/) | One crafted diorama where every object opens content | Click-to-inspect: camera glides to the object, content panel slides in, and the world stays visible behind it |
| [Igloo Inc](https://igloo.inc/) | Awwwards Site of the Year 2024; three.js + three-mesh-bvh + GSAP ([case study](https://awwwards.com/igloo-inc-case-study.html)) | Immersive but trivially navigable; volume-data rendering we can reuse for dopant clouds and ion implantation |
| [Bruno Simon](https://bruno-simon.com/) | Rebuilt portfolio on TSL, which runs on WebGPU when available ([case study](https://www.awwwards.com/brunos-portfolio-case-study.html)) | One TSL codebase across WebGPU and WebGL; sound design that conveys feel |
| [Lusion / Oryzo](https://lusion.co/) | Studio work where the object moves with inertia and weight ([Oryzo notes](https://www.designrush.com/best-designs/websites/oryzo-website-design)) | Physicality: damped springs, overshoot and settle. This is the "locks into place" feel |
| [Bartosz Ciechanowski](https://ciechanow.ski/) | Long-form explainers where every figure is manipulable | The teaching bar: build the mental model one step at a time, and give every claim a control to play with |
| [Visual 6502](http://www.visual6502.org/JSSim/) | The 6502 simulated at transistor level from its mask polygons ([background](https://www.bunniestudios.com/blog/?p=1309)) | Layout polygons as the source of truth; click any shape to identify its node; logic animated on the layout |
| [The Scale of the Universe 2](https://htwins.net/scale2/) | A log-scale zoom with clickable objects at every scale | Scale readout and scrubber; the right density of objects per order of magnitude |
| [Codrops: scroll-driven 3D world](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/) | 2026 write-up: three.js, GSAP ScrollTrigger, Blender baking, KTX2 | Asset pipeline and loading discipline |

Mood references from the field itself, which no showcase site has: the yellow-lit lithography bay, thin-film interference colours on oxide (colour follows thickness), SEM greyscale with its scale-bar overlay, and the hand-drawn cross-sections in the lecture slides.

## Experience design

The inverter cell is the hub. Zoom moves you up and down six layers. The fab timeline, the section plane and the logic view all hang off the cell, and all of them read the same generated model.

&#91;embedded content: zoom layers · 6 levels, 3 views off the cell\]

Scales on the ladder: 300 mm wafers and the 5.43 Å silicon lattice constant are beyond the lecture; 0.6 µm comes from the slide 48 example process and < 20 Å from slide 37.

**Entry: "Enter the cleanroom".** The home page is the cleanroom door, with one call to action. Chips are made in a cleanroom, not a wet lab; the wet benches (HF etch, piranha strip) are stations inside it, and the fab timeline visits them. The loading screen is the gowning sequence, timed to real asset progress: suit, gloves, air shower. It ends with the doors parting onto the yellow-lit lithography bay and a wafer waiting on the chuck, which is the wafer layer of the zoom. Returning visitors skip straight in, and the sequence must be skippable from the first frame.

**Scale layers.** Each layer is its own scene in sensible units, never one giant scene, because float precision breaks across nine orders of magnitude. The transition is a shared-element dive. The camera flies into the clicked object, and the next layer fades in pre-aligned so the object you entered fills the frame you land in. The scale bar animates continuously on a log scale. Breadcrumbs show the path (wafer › die › cell › nMOS › gate oxide); Esc or scroll-out goes up a level.

**The locking section plane.** This is the signature interaction.

- Grab the cell and drag across it (or drag a handle on mobile). The plane follows the pointer with damping, and the cut face renders continuously, so the model never looks broken mid-drag.
- Three snap targets: the slide 27 line through both transistors and both taps, the long axis of the nMOS gate, and the long axis of the pMOS gate. Inside a capture radius a spring pulls the plane in with a small overshoot, a soft mechanical click plays, and the near half slides away along the plane normal to open a gap.
- Labels appear only when locked: leader lines like an engineering drawing, the slide 25 colour legend, and oxide hatched the way the slides draw it.
- Pull upwards on the cell to explode the six mask layers apart. Release and they spring back into registration one by one, each with its own click.

**Click to inspect.** Hover outlines a part. Click glides the camera to fit it and opens a panel: right-hand on desktop, bottom sheet on mobile. Every panel has four parts: what it is, how it's made (linking to its fab step), what it does, and the slide reference.

**Fab timeline.** A scrubber along the bottom with named ticks for each step, plus play and pause. Lithography steps switch the scene lighting to the amber of a yellow-light bay; implant steps rain ions that stop in oxide and penetrate exposed silicon.

**Look and feel.** A dark, neutral instrument-panel background lets the materials carry the colour. Materials keep the slide legend's meaning but look physical: silicon grey-blue and faintly metallic, oxide with a thin-film interference shader whose colour follows its thickness, polysilicon visibly grainy, aluminium bright, resist amber. Type is IBM Plex Sans for UI and IBM Plex Mono for every measurement. Sound is off by default; when on, snaps click and fab tools hum.

## Chapter 1: the CMOS inverter (Topic 2)

Every fact below is in the Topic 2 slides (ELEC0031, Prof. Huiyun Liu). Cite the slide number in each panel. Anything the build adds beyond the slides (real dimensions, extra physics) must be marked as "beyond the lecture" and checked against a textbook source.

| Scene / object | Facts to show (slide) | Interaction |
| --- | --- | --- |
| Silicon structures | Amorphous: no long-range order, dangling bonds, poor conductor. Poly: grains from µm to nm, traps at grain boundaries. Single crystal: ordered, very few defects (3) | Morph one block of atoms between the three states; the poly gate links here |
| Si lattice | Group IV, four bonds to nearest neighbours (4) | Orbit the diamond-cubic cell; highlight one atom's four bonds |
| Dopants | Group V (P, As) gives n-type with a spare electron; Group III (B, Al) gives p-type with a hole (5) | Drop a dopant into the lattice; the free carrier wanders off |
| p-n junction | Diode, one-way current (6); depletion region, internal field, NaWp = NdWn (7–8); band diagram under open circuit, forward and reverse bias (9) | Bias slider: depletion width, field and band diagram update together |
| nMOS transistor | Gate, source, drain, body; gate–oxide–body is a MOS capacitor even though the gate is poly (11). Gate high inverts the channel to n-type and current flows (12) | Gate voltage slider forms the inversion layer; electrons stream source to drain |
| pMOS transistor | Doping and voltages reversed; body tied to VDD; ON when gate is low (13). VDD history: 5 V in the 1980s, now 1.0 V and below (13) | Same slider, mirrored behaviour |
| Switch model | nMOS ON at g=1, pMOS ON at g=0 (14) | Toggle g; each transistor snaps to an open or closed switch icon |
| Inverter | Truth table; one transistor ON, one OFF for each input (15–17) | Toggle A; the conducting path to VDD or GND lights up on schematic and 3D model together |
| NAND / NOR | Full truth tables, series and parallel networks (18–23) | Toggle A and B; four-state walk-through as on the slides |
| Inverter cross-section | p substrate for nMOS, n-well for pMOS (25); substrate tap to GND and well tap to VDD, because metal on lightly doped Si forms a Schottky diode (26) | **The locking section plane.** It snaps to the slide 27 dashed line |
| Mask set | Six masks: n-well, poly, n+, p+, contact, metal (27–28) | Explode the six layers apart; release and they spring back into registration |
| Fab sequence | Oxidise at 900–1200 °C (30); spin resist, which softens where exposed (31); expose through mask (32); HF etch (33); piranha strip (34); n-well by diffusion or As implant (35); gate oxide < 20 Å, 6–7 atomic layers (37); poly by CVD from silane (37); self-aligned n+ and p+, poly gate blocks the implant (39–43); thick field oxide and contact cuts (44); sputtered Al (45) | Step scrubber replays the build on the 3D model; each step names its tool and chemistry |
| Layout rules | Feature size f = minimum poly width; λ = f/2; minimum transistor 4λ/2λ (46–48) | λ grid overlay on the layout; hover any edge to see the rule it satisfies |

The slide 47 design-rule table is an image. Transcribe it by hand from the PDF before building the rule checker.

## Architecture

Masks and a process recipe are the single source of truth. Every mesh, cross-section and fab-step snapshot on screen is derived from them, so chapter 2 means new masks and a new recipe, not new 3D modelling.

&#91;embedded content: data flow · masks + recipe to screen\]

**Process simulator: the core idea.**

- **Model.** The cell sits on a 2D grid at λ resolution (finer where needed). Each grid column holds an ordered list of material intervals: bottom, top, material, doping. Every structure in slides 25–45 can be expressed this way.
- **Ops.** `oxidise`, `deposit(material, thickness)`, `spinResist`, `expose(mask)`, `develop`, `etch(material)` (anisotropic by default, with an isotropic flag that adds undercut), `implant(species, depth)` (blocked by oxide, resist or poly, which gives self-alignment for free), `strip(material)`. Each op is pure (model in, new model out), and snapshots are memoised per step for the timeline scrubber.
- **Mesher.** Greedy-merge neighbouring equal intervals into boxes, giving one mesh per material. Soften edges in the shader, not the geometry.
- **Slicer.** An axis-aligned cut just reads the columns under the line, giving exact rectangles. Caps cost nothing; off-axis cuts intersect the box set with the plane. This avoids stencil capping, which needs fiddly per-object setup and has broken across three.js upgrades ([forum report](https://discourse.threejs.org/t/clipping-plane-stencil-capping/74018)). It also avoids CSG, which is too slow to scrub.
- **Vertical exaggeration.** A per-material z-scale keeps thin films visible. The UI always shows the factor.

**Content.** One MDX file per object with typed frontmatter: id, parent, layer, title, slide references, linked fab step, and sources for anything beyond the lecture. A build-time test fails if any clickable mesh lacks a content file, or any content file points at a mesh that doesn't exist.

**State and routing.** One store holds the focused object path, active layer, section state (offset, locked target), fab step, logic inputs and sound. The URL mirrors it, e.g. `/cmos/inverter/nmos?cut=slide27&step=12`. The camera is derived from state; free orbiting never writes to the URL.

**Rendering.** TSL materials (thin-film interference on oxide, grain noise on poly), an outline pass for hover and selection, and instanced meshes for the lattice. Layers lazy-load per scale behind Suspense. No logarithmic depth buffer is needed, because each layer is its own scene with tight near and far planes.

```
src/
  sim/            simulator, mesher, slicer (pure TS, fully unit-tested)
  chapters/cmos/  masks.ts, recipe.ts, content/*.mdx
  scene/          layers, TSL materials, transitions, section plane
  ui/             panels, timeline, breadcrumbs, scale bar
  state/          store, URL sync
```

## Build plan for an unattended run

Build in vertical slices: each milestone must end deployable and better than the last. Commit after every milestone and write a short `PROGRESS.md` entry covering what shipped, what was cut, and screenshots. If a milestone runs badly over, cut scope inside it rather than skipping verification.

1. **Skeleton and look.** Vite/React/R3F app, WebGPU renderer with fallback, design tokens, typography, the empty layer stack, URL routing, scale bar.
   - Done when the app deploys to a preview URL, a debug route shows renderer type (WebGPU or WebGL 2), and the type and colour system is on a style page.
2. **Process simulator.** The column-stack model, recipe ops, greedy mesher and section slicer, with no UI.
   - Done when unit tests rebuild every cross-section from slides 29–45 and assert the material sequence along the slide 27 line.
3. **Hero scene: the inverter cell.** Generated 3D cell, click-to-inspect on every part, panels from content files.
   - Done when all parts are clickable, every panel cites a slide, and a 60-second screen recording looks intentional.
4. **The locking section plane.** Drag, magnetic snap, halves parting, capped cut face with labels, snap sound.
   - Done when it snaps to all three named sections, the cut colours match the slide 25 legend, and it runs at 60 fps on an M1 laptop.
5. **Fab timeline.** Step scrubber that replays the recipe, with per-step animation (resist spin, exposure light, etch, implant ion rain, CVD, sputter).
   - Done when all steps play forward and backward without visual pops, and every step names its tool and chemistry.
6. **Zoom layers.** Wafer → die → cell → transistor → gate oxide → lattice, each with transitions and a scale readout.
   - Done when you can go from wafer to atoms and back with no loading stall, the scale bar is correct at every level, and deep links restore the view.
7. **Device physics.** nMOS/pMOS operation, the switch model, inverter/NAND/NOR logic on the 3D model, the p-n junction band diagram.
   - Done when every truth-table row from slides 15–23 is reproducible by toggling inputs.
8. **Polish and ship.** "Enter the cleanroom" home page and gowning loader, sound, reduced-motion mode, keyboard navigation, mobile layout, Lighthouse pass, Open Graph images.
   - Done when the quality bar below is met and the README explains how to add a chapter.

## Quality bar, constraints and non-goals

The bar: a physics student learns something they couldn't get from the slides, and a creative developer can't tell it was built by an agent.

**Must**

- 60 fps on an M1 MacBook Air; 30 fps or better on a mid-range phone (reduce quality automatically, never content).
- First interactive view in under 3 s on a fast connection, with a JS bundle under 1 MB gzipped before lazy chunks.
- Physically honest. Layer order, doping types, carrier types and voltages must match the slides. Exaggerated vertical scale is allowed but always labelled (e.g. "oxide thickness ×50").
- Every panel cites its slide; every "beyond the lecture" fact names its source.
- Keyboard-reachable objects, visible focus, `prefers-reduced-motion` respected, and a text outline of every scene for screen readers.
- Deep links: any object, layer, fab step or section state restorable from the URL.

**Anti-slop rules**

- No purple-to-blue gradients, glassmorphism cards, floating particles for decoration, or default drei environment maps.
- No generic sans-serif hero with a gradient headline. Typography, colour and motion come from the field's own visual language (inspiration board).
- Motion has physics (springs, inertia, settle). No linear tweens and no easing that feels like a slideshow.
- Write copy like a good lab demonstrator: short, exact, numbers with units. No marketing voice.

**Non-goals for chapter 1**

- Accurate TCAD simulation, quantitative device modelling or real I–V curves.
- Accounts, a CMS, comments or a backend.
- Other ELEC0031 topics. Leave the chapter structure ready for them, but don't build them.
- VR/AR.

**How to verify**

- Unit tests on the process simulator (cross-sections against the slides).
- Playwright visual snapshots of each layer and each fab step; review the screenshots, don't just pass them.
- A fact-check pass: walk every panel against the PDF and list any mismatches in `PROGRESS.md`.
- A fresh-eyes review at the end, by someone or something that didn't build it, against this brief.

## Sources

- ELEC0031 Topic 2, *Introduction to CMOS VLSI Design*, Prof. Huiyun Liu (lecture PDF supplied by Felix)
- [Utsubo: 100 Three.js tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips): WebGPU in Safari 26 and automatic WebGL 2 fallback
- [Maxime Heckel: Field Guide to TSL and WebGPU](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/): R3F v9 async `gl` prop
- [R3F 10.0.0-alpha.6 release](https://newreleases.io/project/npm/@react-three/fiber/release/10.0.0-alpha.6): WebGPU-first, still alpha
- [Codrops: Building The Monolith](https://tympanus.net/codrops/2025/11/29/building-the-monolith-composable-rendering-systems-for-a-13-scene-webgl-epic/)
- [Awwwards: Igloo Inc case study](https://awwwards.com/igloo-inc-case-study.html)
- [Awwwards: Bruno Simon portfolio case study](https://www.awwwards.com/brunos-portfolio-case-study.html)
- [Codrops: They Call Me Giulio](https://tympanus.net/codrops/?p=113157): vanilla three.js for render-pipeline control
- [Codrops: More Than a Portfolio (2026)](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/)
- [three.js forum: stencil capping broke on upgrade](https://discourse.threejs.org/t/clipping-plane-stencil-capping/74018)
- [bunnie: Visual 6502 simulator](https://www.bunniestudios.com/blog/?p=1309)

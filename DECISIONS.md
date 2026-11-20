# Decisions

Ambiguities resolved during the unattended build. Each entry: decision, why, and what it affects.

## Versions (checked 2026-11-20 against the npm registry)

Pinned exactly: `three@0.187.0`, `@react-three/fiber@9.8.2` (v9 stable; v10 is still alpha), `react@19.3.1`, `vite@8.3.7`, `vitest@5.1.0`, `typescript@6.0.3`, `zustand@5.1.0`, `gsap@3.15.1`, `zod@4.6.7`, `@playwright/test@1.65.1`.

- **TypeScript 6.0.3, not 7.0.2.** 7.0.2 (the native-port compiler) was published the same day as this build; 6.0.3 is the newest release older than two weeks.
- **Vite 8.3.7 rather than 8.3.8**, same reason (8.3.8 was days old with no fixes we need).
- **No `@react-three/drei`.** The brief allows only its renderer-agnostic helpers. The camera has to be a spring rig driven by app state (brief: "the camera is derived from state"), and DOM panels live outside the canvas, so `CameraControls` and `Html` would be unused weight. A ~150-line spring orbit rig replaces it.

## Slides vs. the brief vs. physics

- **Slide 48, "Length / Width = 4λ/2λ".** Slide 46 defines f (= 2λ) as the source–drain distance, i.e. the channel *length*. So the minimum transistor has L = 2λ and W = 4λ. The slide's own numbers ("0.6 µm wide, 1.2 µm long") swap the words. The build shows **W/L = 4λ/2λ** and the layout-rules panel notes the slide's wording.
- **Diffusion widths.** Slide 28 draws the nMOS and pMOS diffusions the same height; slide 48 sizes the pMOS at 8/2. The mask set (source of truth) follows slides 27–28: both 4λ wide. The pMOS panel mentions the 8/2 sizing on slide 48 and why (hole mobility, slide 10).
- **Slide 47 contact rules (read from the figure).** Contacts 2λ × 2λ, metal1 surrounds a diffusion contact by 1λ, metal1–poly contact shown with 2λ (read as the contact size), via spacing 3λ. Metal1/metal2/diffusion width and spacing 4λ; poly width 2λ, spacing 3λ; poly extends 2λ past diffusion; diffusion stays 6λ inside / outside the n-well edge. Encoded in `src/chapters/cmos/rules.ts`.
- **n-well dopant.** Slide 35 says arsenic (diffusion or implant). Kept as on the slide. The panel adds, as beyond the lecture, that phosphorus is the more common n-well dopant in practice.
- **Thicknesses and depths** are not given on the slides except gate oxide (< 20 Å, slide 37) and λ = 0.3 µm (slide 46). Typical 0.6 µm-process values are used and marked "beyond the lecture" (source: Plummer, Deal & Griffin, *Silicon VLSI Technology*, ch. 2): mask oxide 200 nm, resist 800 nm, poly 300 nm, n+/p+ junction 250 nm, n-well 1.5 µm, field oxide 600 nm, Al 700 nm. Gate oxide is drawn at 2 nm × 50.
- **Thermal oxidation does not consume silicon in the model.** The slides draw a flat Si surface (30, 37, 39). Real oxidation consumes ~0.44 of the oxide thickness from the Si; noted in the oxidation panel.
- **Metal fills contacts and is planarised**, as slide 45 draws it. The part of the Al sitting in a contact cut is labelled as a *contact* object.
- **Poly doping is not tracked per region.** Slide 37: poly is "heavily doped to be good conductor". Implants landing on poly do not change its identity, so the U-shaped gate stays one object (input A).

## Architecture

- **Content as typed TypeScript modules, not MDX.** Each object's panel has the same four fixed parts plus slide references; that is structured data, not prose. `content/*.ts` files are validated with zod at test time, need no bundler plugin, and give the integrity test direct access. One file per object, as the brief asks.
- **Section caps by box clipping, not stencil or CSG.** The mesher outputs axis-aligned boxes, and all three snap targets are axis-aligned. Clipping a box by an axis-aligned plane gives another box whose face on the plane *is* the cap. Exact, cheap enough to rebuild per frame, and it can't break on a three.js upgrade.
- **Simulator grid at 1λ.** All slide 27–28 coordinates fall on whole λ, so a 1λ grid is exact; it keeps fractional re-meshing during fab playback under a few ms.
- **Fractional ops for the timeline.** Every op takes a `progress ∈ [0,1]` (deposit grows, etch thins, implant deepens). The timeline renders `op_k(snapshot_{k-1}, t)`, so scrubbing in either direction is continuous by construction.
- **Objects identified by connected components + anchors.** The mesher labels connected regions per material; each content file names the anchor point(s) that pick its region. The integrity test fails if a region has no content or an anchor hits nothing.
- **NAND / NOR are schematic-only.** The brief's chapter 1 masks define the inverter. NAND/NOR are 2D switch-level walk-throughs (slides 18–23) with the same switch model, not 3D layouts.
- **Router is hand-written** (History API ↔ zustand). Paths: `/`, `/cmos/{wafer,die,inverter,inverter/nmos,inverter/pmos,inverter/nmos/gate-oxide,lattice}`, plus query `cut`, `step`, `focus`, `a`, `b`, `view`.

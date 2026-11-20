# Nanoscale Atlas — progress log

Spec: [BRIEF.md](BRIEF.md). Physics source: [docs/topic2-cmos.pdf](docs/topic2-cmos.pdf) (ELEC0031 Topic 2, 49 slides; PDF page = slide number).
Decisions: [DECISIONS.md](DECISIONS.md).

## Plan

Vertical slices, in the brief's order. Each milestone ends with tests green, a production build, screenshots reviewed by eye, a commit and an entry below.

| # | Milestone | Core deliverable | Verification |
|---|---|---|---|
| 1 | Skeleton and look | Vite + React 19 + R3F 9 on `WebGPURenderer` (WebGL 2 fallback), tokens, Plex type, layer stack, URL router, log scale bar, `/debug`, `/style` | Build passes, `/debug` reports backend, style page screenshot |
| 2 | Process simulator | `src/sim`: column-stack model, pure ops, 45-step recipe from slides 29–45, greedy mesher, slicer, component labeller, slide 47 rule checker | Vitest: every slide 29–45 cross-section asserted; slide 27 line sequence asserted; layout passes slide 47 rules |
| 3 | Hero cell | Generated 3D inverter, TSL materials, hover outline, click-to-inspect, typed content per object | Content ↔ mesh integrity test; every panel cites a slide; screenshots |
| 4 | Section plane | Drag, spring snap to 3 targets, halves part, legend-coloured caps, leader labels, explode masks, click sound | Snap unit test; screenshots at each lock; fps check |
| 5 | Fab timeline | Scrubber over the recipe with fractional ops (no pops), per-step animation, amber litho light, ion rain | Fractional-op continuity test; a screenshot per step |
| 6 | Zoom layers | Wafer → die → cell → transistor → gate oxide → lattice, dive transitions, scale bar, breadcrumbs, deep links | Screenshot each layer; deep-link reload test |
| 7 | Device physics | MOS gate-voltage, switch model, inverter/NAND/NOR, p-n junction bias explorable | Truth tables slides 15–23 unit-tested |
| 8 | Polish and ship | Cleanroom door + gowning loader, sound, reduced motion, keyboard, mobile, OG image, README | Lighthouse, bundle size, final self-review |

Deploy: no Vercel/Netlify credentials on this machine (`vercel` not installed, no token), so previews are local (`npm run build && npm run preview`). Noted per milestone.

## Log

(entries added per milestone below)

### M1 · Skeleton and look — done

Shipped
- Vite 8 + React 19 + R3F 9.8 on `three/webgpu` `WebGPURenderer` (async `gl` prop). Backend detected and shown at `/debug`; `?gl=webgl` forces the WebGL 2 fallback. Both verified headless (Playwright Chromium reports `webgpu`; forced run reports `webgl2`).
- `RenderPipeline` post chain (TSL): scene pass + two outline passes (hover, focus) + lithography amber grade + transition veil.
- Spring camera rig (`src/scene/rig.ts`), spring library (`src/scene/spring.ts`), adaptive DPR (drops resolution when fps < 45, never content).
- Six-layer stack, each layer a lazy chunk with its own units (`src/chapters/cmos/layers.ts`); dive transition core with scale-matched entry (`src/scene/transition.ts`).
- URL ⇄ store sync (`src/state/url.ts`): layer changes push history, other state replaces.
- Live log scale bar (1-2-5 bar + mm → µm → nm → Å ladder), breadcrumbs, Esc to go up.
- Design tokens, Plex Sans/Mono, `/style` page. Synthesised sound module (off by default).
- Bundle: entry 74 KB gz; the three.js shell is a 453 KB gz lazy chunk loaded behind the home page.

Cut / deferred: layers are placeholders until M3/M6.
Deploy: skipped (no deploy credentials on this machine).
Screenshots: `docs/screenshots/m1/`.

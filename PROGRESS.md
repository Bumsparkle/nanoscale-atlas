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

### M2 · Process simulator — done

Shipped (`src/sim`, `src/chapters/cmos`, pure TypeScript, no UI)
- Column-stack model on a 62 × 28 grid at 1λ (`sim/types.ts`, `sim/model.ts`).
- Pure ops with fractional progress: `oxidise`, `deposit` (conformal or planar; planar Al marks contact plugs), `spinResist`, `expose` (clear- or dark-field), `develop`, `etch` (anisotropic, selective), `implant` (blocked by anything on the Si, which gives self-alignment), `strip` (`sim/ops.ts`).
- `Process` memoises a snapshot per step; `at(s)` evaluates fractional positions for the scrubber (`sim/recipe.ts`).
- The six masks of slides 27–28 on a λ grid (`chapters/cmos/masks.ts`); a 45-step recipe covering slides 29–45, each step with slide, tool, chemistry and any beyond-the-lecture note plus its source (`chapters/cmos/recipe.ts`).
- Greedy mesher → boxes → connected components (the clickable objects) (`sim/mesher.ts`); axis-aligned slicer, region grouping, surface sequence (`sim/slicer.ts`).
- Slide 47 rules transcribed from the image, plus a checker producing per-edge measurements for the later hover overlay (`chapters/cmos/rules.ts`).

Tests: 42 passing, covering
- the cross-section after every slide 29–45 at 16 points on the slide 27 line;
- the surface doping sequence along the slide 27 line (13 regions);
- the MOS stack along the nMOS gate;
- component counts (6 contacts, 3 metal nets, 1 poly node, 3 n+, 3 p+);
- fractional continuity (start and end of every step match the snapshots within 1 %; monotonic progress);
- layout passes every slide 47 rule;
- op purity, selectivity, blocking, planarisation;
- re-mesh budget (< 8 ms per fractional frame).

Cut: isotropic etch flag (see DECISIONS.md).
Found while testing: the gate oxide is a single object under the whole poly U (logged in DECISIONS.md).

### M3 · Hero scene: the inverter cell — done

Shipped
- The cell is generated live from masks + recipe: mesher components → one mesh each (`scene/CellModel.ts`), with coplanar internal faces cancelled so transparent oxide shows no banding (`scene/cellGeometry.ts`).
- TSL materials (`scene/materials.ts`):
  - silicon tinted by doping (n cool, p warm);
  - oxide transparent, with two-beam thin-film interference driven by the real thickness and view angle;
  - poly grains from a Worley F2–F1 field;
  - bright aluminium;
  - amber resist that pales with exposure dose;
  - cut faces switch to the slide 25 legend, with oxide and metal hatched.
- Lab environment built in code (ceiling softbox + strip fixtures, PMREM), not a stock HDRI. λ drafting grid underneath.
- Click-to-inspect:
  - hover outline + label;
  - click glides the camera (spring) to fit the object and opens the right-hand panel (bottom sheet on mobile);
  - the projection shifts so the object sits clear of the panel;
  - buried objects fade the metal and field oxide (x-ray).
- 18 content files (one per object, zod-validated), each with the four parts + slide chips + beyond-the-lecture notes with sources + a link to the fab step that makes it.
- Integrity test: every mesh component at every one of the 45 fab steps resolves to a content file, and every content file matches a mesh.
- "parts" outline: keyboard-reachable list of every object (focus = highlight, Enter = inspect), doubling as the screen-reader text outline.

Verification
- 47 tests pass.
- Scripted tour (`node scripts/tour.mjs <url> cell`) records `docs/recordings/cell.webm` (local only, 24 MB, gitignored) and saves stills to `shots/cell/`; the stills were reviewed.
- The tour exposed three bugs, all fixed: focus flew the camera inside the metal, buried parts were hidden by the wiring, and the hover label went stale when hovering from the parts list.

Open issue: in headless Chromium, Playwright's video capture breaks WebGPU canvas compositing (black canvas, smeared DOM). Plain screenshots under WebGPU are fine. Recordings therefore use the WebGL 2 path (`GL=1`).
Screenshots: `docs/screenshots/m3/`.

### M4 · The locking section plane — done

Shipped
- **Section view.** Drag across the cell and the plane sweeps in the direction you drag (x or y), following the pointer on a damped spring. The cut faces are rendered continuously, because box clipping produces exact caps every frame.
- **Magnetic snap** to three targets: the slide 27 line, the nMOS gate axis and the pMOS gate axis.
  - Capture radius 1.6λ, release 3.0λ (hysteresis). Snap spring ω = 26, ζ = 0.48 gives one visible overshoot.
  - A synthesised detent click plays on capture.
  - The near half slides 10λ along the normal and fades to a ghost. The camera turns to face the far half's cut face.
- **Locked labels.**
  - Engineering-drawing callouts in collision-free rows, with leader lines.
  - Each region is named with the slide 25 legend plus its role: source, drain, GND, Y, VDD, A, substrate tap, well tap.
  - The slide 25 legend panel. Cut faces use the legend greys, with oxide and metal hatched like the slides.
- **Masks view.** Pulling up separates the cell into its six mask tiers (plus substrate), labelled with the slide 28 mask names. On release they spring back into registration one by one, top tier first, each with its own click. The field oxide clears while separated.
- Chips and keys: `1`/`2`/`3` lock the targets, arrow keys nudge the plane by 1λ, `r` rotates it, `e`/`s`/`m`/`f`/`l` switch views. Deep links: `?view=section&cut=slide27|ngate|pgate`, or `cut=<λ>&axis=x|y`.

Verification
- Unit tests: capture of all three targets, no capture outside the radius or on the wrong axis, hysteresis, label content for the slide 27 and gate cuts. 52 tests in total.
- Frame rate (`scripts/fps.mjs`, headless Chromium, WebGPU on this machine): 60 fps idle, 58.9 fps while sweeping the plane, with geometry rebuilt every frame. The machine is an Apple M1 (`sysctl machdep.cpu.brand_string`), the brief's target hardware.
- Screenshots of each lock, a free cut and the exploded masks were reviewed. Fixed after review: the near half occluded the cut face, the masks view framing, the substrate callout anchor, and n-well vs substrate contrast.

Screenshots: `docs/screenshots/m4/`.

### M5 · Fab timeline — done

Shipped
- Timeline scrubber (`ui/Timeline.tsx`):
  - one named tick per recipe step (45), grouped by phase (wafer, n-well, gate, n+, p+, contacts, metal);
  - play/pause, drag to scrub, keys ← → space Home End;
  - hover a tick for the step name.
- Step card naming the slide, tool, chemistry, a one-line demonstrator note and any beyond-the-lecture detail with its source.
- Playback eases through each step and dwells briefly on it. The position is a critically damped spring, so scrubbing has weight and never overshoots into a neighbouring step.
- Per-step effects (`scene/FabEffects.tsx`):
  - **Implant:** an ion beam (As blue, B warm). Each ion's stop point comes from the model before the step: ions stop on oxide, resist or poly and penetrate exposed silicon to the implant range. This shows self-alignment directly.
  - **Exposure:** the reticle (chrome on glass) hovers over the wafer, and light passes only through its clear areas (clear- or dark-field per step).
  - **Furnace:** a 900–1200 °C glow on oxidation and CVD.
  - **Wet bench:** a liquid film for HF, piranha and develop.
  - **Deposition:** CVD and sputter atoms arriving from above.
  - **Lithography:** spin, expose and develop turn the whole frame yellow-light amber.
- Hum per tool while playing (synthesised, only when sound is on). Deep link `?view=fab&step=N`.

Verification
- Fractional continuity and monotonicity unit tests (from M2) cover every step, forward and backward.
- `scripts/fabsheet.mjs` screenshots all 45 steps into a contact sheet (`docs/screenshots/m5/fab-sheet.png`), which was reviewed against slides 29–45. The sequence matches.
- Fixed after review: the wet-bench sheen read as a checkerboard, and the dark-field exposures blew out to glare.
- The sheet first came out black: `fabsheet.mjs` and `tour.mjs` launched Chromium without the GPU flags `shots.mjs` uses. Fixed.

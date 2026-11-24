# Nanoscale Revision — progress log

Spec: [BRIEF.md](BRIEF.md). Physics source: the ELEC0031 Topic 2 lecture slides (49 slides; PDF page = slide number). The PDF is UCL course material and is not in this repository; locally it lives at `docs/topic2-cmos.pdf`, which is gitignored.
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

### M6 · Zoom layers — done

Shipped (each layer is its own scene in its own unit, lazy-loaded)
- **Wafer** (1 unit = 1 mm):
  - 300 mm polished wafer with a die grid and diffraction sheen, on a vacuum chuck under yellow-bay amber light;
  - orientation notch; the inverter's die is marked.
- **Die** (1 unit = 10 µm):
  - illustrative 4 mm floorplan with pad ring and blocks;
  - near the target, standard-cell rows drawn from the inverter's own six masks;
  - a pulsing beacon and callout locate the inverter.
- **Cell** (λ): from M3–M5.
- **Transistor** (λ):
  - the generated cell cropped to the nMOS or pMOS and cut along the slide 27 line;
  - a gate-voltage slider inverts the channel and carriers stream source → drain (electrons for nMOS, holes for pMOS);
  - depletion region under the gate; S/D/G/B terminal callouts (slide 11).
- **Gate oxide** (Å): single-crystal Si, < 20 Å amorphous SiO₂ (continuous random network, 6–7 layers), polysilicon grains in three orientations; thickness gauge.
- **Lattice** (Å):
  - diamond cubic (a = 5.43 Å) with one atom's four bonds highlighted (slide 4);
  - morphs between single crystal, poly (a grain boundary breaks bonds) and amorphous (dangling bonds) (slide 3);
  - P donor with a wandering free electron, or B acceptor with a wandering hole (slide 5).
- **Transitions:**
  - The dive aims for a view slightly wider than the next layer's rest pose.
  - The next layer enters at exactly the metres-per-pixel it left at; the far plane follows the camera.
  - The camera distance spring is integrated in log space, so zoom is perceptually uniform.
  - A 170 ms luminance dip masks the swap. Esc or zooming out goes up; breadcrumbs jump anywhere.
- 12 more content files (one per object). An integrity test checks hand-built layer nodes ↔ content both ways.

Verification
- `node scripts/tour.mjs <url> zoom` wheels from wafer to lattice and Escapes back to the wafer, sampling the scale.
- Scale continuity:
  - Before the fix, layer handoffs jumped by up to 1.14 decades (transistor → oxide).
  - After it, no handoff shows a jump. The only fast changes are deliberate inward dollies during a dive, all monotone, under the veil.
- Deep links (`/cmos/inverter/nmos?vg=1.00`, `/cmos/inverter/pmos`, `…/gate-oxide/lattice`) restore each view on a fresh load (screenshots).
- Fixed after review: an instanced-bond buffer overflow (WebGPU validation error), a die texture over the GPU size limit, a washed-out die, the transistor cut face dominated by metal, carriers hidden behind the cut face, oxide labels off-screen.

Screenshots: `docs/screenshots/m6/`.

### M7 · Device physics — done

Shipped
- **Device model** (`chapters/cmos/device.ts`): the slide 14 switch rule (nMOS ON at g = 1, pMOS at g = 0), switch-level networks (series/parallel), and the INV/NAND/NOR gates of slides 15–23 as data.
- **Logic view on the cell.** Toggle A and the conducting path lights on the 3D model:
  - A = 1: GND rail, nMOS source/drain, contacts and Y glow green, and the poly (input A) glows amber;
  - A = 0: VDD rail, pMOS source/drain and Y glow.

  The schematic and truth table in the bench update together.
- **Logic bench** with five tabs:
  - Inverter (slides 15–17);
  - Switches (slide 14);
  - NAND (four-state walk-through, citing slides 19–22 per row);
  - NOR (slide 23);
  - p-n junction (slides 6–9): bias and Na/Nd sliders drive depletion width (NaWp = NdWn), fixed ions, a triangular field, and band bending with split Fermi levels.

  Each tab cites its slide.
- **Transistor layer (M6):** the gate-voltage slider inverts the channel, with electrons or holes flowing (slides 12–13).
- **Lattice layer (M6):** P and B dopants (slide 5).

Verification
- `device.test.ts`: every truth-table row of slides 15–23. NAND and NOR are checked exhaustively; no input combination floats or fights.
- Junction: NaWp = NdWn holds; forward bias narrows W and lowers the barrier, reverse bias does the opposite.
- 61 tests pass.
- Screenshots reviewed (A = 0/1, NAND A=1 B=0 against slide 21, junction forward bias against slide 9b). Fixed after review: schematic labels collided with open switches, and Y was clipped.

Cut: NAND/NOR are schematic-only (no 3D layout), as logged in DECISIONS.md.

### M8 · Polish and ship — done

Shipped
- **"Enter the cleanroom" home.** Brushed-steel bay doors with yellow-light windows and door plates, and one call to action.
  - Gowning sequence (suit → gloves → air shower), each step gated by a real loading milestone: 3D shell chunk loaded → GPU renderer initialised → first frames drawn and all six layer chunks fetched.
  - Skippable from the first frame (button or `Esc`); returning visitors (localStorage) go straight in.
  - The doors part on a heavy spring onto the amber-lit wafer, which has been rendering behind them all along.
- **Sound** (off by default): synthesised detent clicks on snaps and mask re-registration, a per-tool hum during fab playback, air on dives.
- **Reduced motion:** `prefers-reduced-motion` respected, plus a manual "motion" toggle. Springs settle instantly, dives become a cut with a short dip, CSS motion is disabled.
- **Keyboard:**
  - every object is reachable via the "parts" outline (focus highlights it in 3D, Enter inspects);
  - views, snaps, timeline and `Esc` all have keys;
  - visible amber focus rings.
- **Screen readers:** the outline doubles as a text description of each scene, and panels, the step card and the bench are `aria-live`.
- **Mobile:**
  - bottom-sheet panels and a compact header;
  - a camera distance boost for portrait aspect, applied consistently so the scale bar stays correct;
  - touch orbit and pinch zoom; the timeline and bench are stacked above the view bar.
- **Performance:** the three.js shell loads on idle after the door paints. Adaptive DPR drops resolution, never content.
- **Open Graph image** (`public/og.png`, the slide 27 section), meta tags, `robots.txt`, and a README with "How to add a chapter".
- **Layer hints:** one line per layer saying what to do next.

Measurements
- Lighthouse, production build:
  - mobile (simulated slow 4G, 4× CPU): Performance 84, Accessibility 100, Best Practices 100, SEO 100. FCP 2.3 s, LCP 2.5 s, TBT 430 ms, CLS 0. Before the deferred shell it was 57, with FCP 3.7 s.
  - desktop: Performance 98, FCP 0.7 s, TTI 1.0 s.
- Bundle: entry 75 KB gz; the 3D shell + three.js is 481 KB gz (lazy); each layer is 1–6 KB gz.
- 60 fps idle and 59 fps while dragging the section on this Apple M1 (WebGPU).
- Mobile frame rate was not measured on a real phone (see open issues).

## Fact-check pass (every panel and step against the PDF)

Walked all 30 content files and 45 recipe steps against the slides. Mismatches found and fixed:
1. **`die-site`:** "dies are separated by scribe lines and sawn apart" was stated without a slide. Moved to beyond the lecture, with a source.
2. **`wafer-notch`:** how it is made, and the alignment claim, were not on any slide. Rewritten so the panel only cites slides 3 and 27–28; the rest moved to beyond the lecture (SEMI M1).
3. **`bond-pads`:** the overcoat opening and wire bonding were stated as fact. Moved to beyond the lecture.
4. **`cell-rows`:** the reason for row mirroring was given as fact; it is now only in beyond the lecture.
5. **`inverter-instance`:** the λ dimensions are ours, not the slides'. Now flagged, pointing to `masks.ts` and the rules test.
6. **Gate oxide step:** slide 37 says "deposit"; the step's tool is an oxidation furnace. The step now quotes the slide and notes the difference as beyond the lecture.
7. **`nwell`:** the isolation statement (reverse-biased well junction) is not on the slides. Moved to beyond the lecture (Weste & Harris) in M3.

Flagged in DECISIONS.md and kept:
- Slide 48 swaps the words length/width; the build uses W/L = 4λ/2λ.
- The arsenic n-well (slide 35) is kept, with the note that phosphorus is more common.

No numeric fact contradicts the slides: < 20 Å / 6–7 layers, 900–1200 °C, λ = 0.3 µm, f = 2λ, the rules, the truth tables, the VDD history, the dopant groups.

## Final self-review against BRIEF.md

| Brief section | Status | Notes |
|---|---|---|
| **Vision:** semantic zoom, click to inspect, locking section | ✅ | All three, on one persistent canvas. Six layers, scale-matched dives, log scale bar mm → µm → nm → Å. |
| Layout + recipe as source of truth | ✅ | The cell, every fab snapshot, every cut and the die's cell rows all come from `masks.ts` + `recipe.ts`. |
| **Tech:** three r187, WebGPURenderer + TSL, R3F v9, no v10 | ✅ | WebGL 2 fallback verified (`?gl=webgl`). TSL post (outline, litho grade, veil) via `RenderPipeline`. |
| drei only for agnostic helpers | ✅ (none) | Not needed (DECISIONS.md). |
| GSAP | ⚠️ installed, unused | Every motion is a spring by design; GSAP is pinned but not imported, so it adds nothing to the bundle. Remove or use for choreography later. |
| zod content, Zustand, URL navigation | ✅ | |
| Blender hero props (wafer, packaged die) | ❌ cut | The wafer and die are procedural (canvas textures + TSL). There is no packaged die. |
| Vitest; Playwright screenshots | ✅ | 61 tests; scripted screenshot, tour and contact-sheet harnesses. Not wired as CI visual-regression *assertions* (screens are reviewed by eye). |
| Escape hatch to vanilla three | ✅ by design | The scene core is imperative; React is the shell. |
| **Experience: entry** (door, gowning timed to real progress, skippable, returning skip, doors part onto the wafer) | ✅ | |
| Scale layers, shared-element dive, breadcrumbs, Esc / scroll-out | ✅ | The transistor → oxide dive crosses ~2 decades under a 170 ms dip. |
| Locking section plane (damped drag, 3 snaps, overshoot, click, halves part, labels only when locked, legend, hatched oxide) | ✅ | The near half fades to a ghost so the cut stays readable (DECISIONS-worthy deviation, see M4). |
| Pull up to explode six masks, spring back one by one with clicks | ✅ | Lives in its own "Masks" view so it doesn't fight the section drag. |
| Click to inspect: hover outline, glide, panel (right / bottom sheet), four parts + slide | ✅ | |
| Fab timeline: named ticks, play/pause, amber litho light, implant ion rain | ✅ | Plus reticle exposure, furnace, wet-bench and CVD/sputter effects. |
| Look and feel: dark instrument panel, physical materials, thin-film oxide, grainy poly, Plex type, sound off by default | ✅ | |
| **Chapter 1 table**, row by row | ✅ | Silicon structures morph · lattice + 4 bonds · dopants · p-n junction bias explorable · nMOS/pMOS gate slider · switch model · inverter lit on schematic + 3D · NAND/NOR (schematic only) · cross-section + taps · mask set · fab sequence · layout rules in code + tests. **Gap:** the λ-grid overlay with per-edge rule hover in the UI is not built; `checkRules()` already returns per-edge measurements ready for it. |
| **Architecture:** column model, pure ops, memoised snapshots, greedy mesher, slicer, vertical exaggeration shown | ✅ | Isotropic etch flag cut (DECISIONS.md). Content files are TS modules, not MDX (DECISIONS.md). |
| State and routing deep links | ✅ | Layer, device, view, cut, step, focus, inputs, VG. Free orbit never writes the URL. Lattice structure/dopant and bench tab are not in the URL. |
| **Build plan:** 8 milestones, each committed, PROGRESS entries, screenshots | ✅ | No preview deploys (no credentials). |
| **Quality bar:** 60 fps M1 | ✅ | Measured on an M1. |
| 30 fps mid-range phone | ❓ | Not measured on a device; adaptive DPR is in place. |
| < 3 s first view, < 1 MB gz before lazy chunks | ✅ | 75 KB gz entry; desktop FCP 0.7 s. |
| Physically honest; exaggeration labelled | ✅ | "vertical ×1 · gate oxide ×50" always shown on the cell and transistor. |
| Every panel cites a slide; beyond-lecture facts sourced | ✅ | Enforced by schema + test. |
| Keyboard, focus, reduced motion, text outline | ✅ | |
| Deep links | ✅ | |
| **Anti-slop:** no purple-blue gradients, glassmorphism, decorative particles, stock env maps, gradient headline; spring motion; demonstrator copy | ✅ | Particles exist only where they are physics (ions, carriers, deposition). The environment is built in code. One CSS ease remains on hover nudges. |
| **How to verify:** unit tests, screenshots reviewed, fact-check, fresh-eyes review | ⚠️ | Done except the independent fresh-eyes review, which needs someone who didn't build it. |

## Open issues
- **Recording:** Playwright video capture breaks headless WebGPU compositing, so recordings use the WebGL 2 path. Plain screenshots under WebGPU are fine.
- **Poly grains** read as "camouflage" at some distances; worth tuning against a real SEM reference.
- **NAND/NOR highlighting:** the 3D cell lights only the inverter path. The NAND/NOR tabs say so but still share the view.
- **Lighthouse:** the `valid-source-maps` and `bf-cache` audits fail on mobile (not scored categories).

## What I'd do next
1. ~~A λ-grid layout view~~: done (Layout view). Next: keyboard stepping through edges, and saving edited layouts to the URL.
2. An independent fresh-eyes review against BRIEF.md, and on-device phone fps checks.
3. A preview deploy (Vercel/Netlify, SPA fallback to `index.html`) once credentials exist.
4. Playwright visual-regression assertions with tolerances, in CI.
5. A Blender hero wafer and a packaged die with KTX2 textures, replacing the procedural wafer.
6. NAND/NOR as real mask sets so they get 3D cells and their own fab replay: the chapter-2 path, exercising "new masks, new recipe".
7. Put lattice structure/dopant and the bench tab in the URL.


### Layout view · slides 46–48 — done (2026-11-21)

Shipped
- **Layout mode** (`g`, or the Layout tab) on the inverter cell. The camera dolly-zooms to a near-orthographic top view, and the six masks are drawn flat in slide 25 legend colours, as in the slide 27 mask-set image. Switching back reverses it.
- **λ grid:** 1λ, bold every 4λ. The readout shows λ = f/2 = 0.3 µm for the f = 0.6 µm process (slide 46) and λ in screen pixels, from the same live value as the scale bar.
- **Layer toggles** for all six masks, plus "all six" / "none". The URL follows: `?view=layout&layers=poly,ndiff`.
- **Hover:**
  - Hovering any edge or gap highlights it with a dimension line and shows its rules, e.g. "Poly width: 2λ (min 2λ) · slide 47 · at minimum".
  - Hovering a shape gives its size.
  - Rules met at exactly the minimum get an amber dot (62 of 109 checks in the default cell).
- **Edit mode:**
  - Drag any edge; it snaps to 1λ, with a tick on each step when sound is on.
  - The rule check runs live. Violations show in red with the rule and the shortfall, e.g. "Metal1 spacing: 2λ (min 4λ) · short by 2λ · slide 47", and are listed in the panel.
  - "Reset layout" restores slides 27–28.
  - Leaving the view rebuilds the 3D cell, sections and fab replay from the edited masks (verified: widening the nMOS gate to 3λ shows up in the slide 27 section, and the transistor table reads L = 3λ = 0.9 µm).
- **Slide 48 callouts:** a W/L callout on both gates (4λ / 2λ = 1.2 µm / 0.6 µm), recomputed from the layout, plus a table in the panel.
  - The slide's text gives L = 1.2 µm, W = 0.6 µm. That contradicts slide 46 (f, the source–drain distance, is set by the poly width) and the drawn layout.
  - The panel quotes the slide and states the correct reading. DECISIONS.md is corrected: an earlier entry wrongly said the slide's own sentences disagreed with each other.
- **Content:** 8 new content files (six masks, λ rules, minimum transistor) in the usual four-part format with slide citations, shown inline in the layout panel.

Verification
- 92 tests pass (31 new in `layout.test.ts`):
  - λ snapping and edge moves (immutability, the 1λ minimum, bounds);
  - pass and fail cases for every rule in the slide 47 table, metal2 and via spacing included;
  - every edge of the default layout has at least one rule, and none is violated;
  - a deliberately broken layout produces exactly five expected violations with the right shortfalls;
  - W/L read from the layout;
  - an edited layout regenerates a valid process and mesh (6 contacts, 3 wires, 1 poly node, all with content) with the expected cross-section.
- Screenshots reviewed and saved in `docs/screenshots/layout/`:
  - all layers, each single layer, poly + n-diffusion;
  - hover on an edge and on a gap;
  - a violation;
  - the transistor panel;
  - the transition sequence;
  - the 3D section after an edit;
  - mobile.
- Fixed after review:
  - the transition threw the cell off-screen (filmOffset vs. a narrow lens);
  - single-layer views hid every rule (checks now show if they touch any visible layer);
  - callouts collided on mobile;
  - the "slide 27" label overlapped the grid;
  - the inline content panel used different type from the inspect panel.

Open: edited layouts are not saved across reloads or encoded in the URL; hover is mouse-only (keyboard users get the violation list and shape panels, but cannot step through edges).


### Lesson and Revise modes — done (2026-11-21)

**Fact inventory.** `content/topic2/facts.json` holds 173 facts covering all 49 slides (104 key). They were read from the slide text and from the images:
- the slide 47 rules table, metal2 and vias included;
- the slide 8 charge and field plots, and the slide 9 band diagrams;
- the slide 3–4 sketches, the slide 7 ion drawing and the slide 11/13 structure drawings;
- the slide 18/23 equivalent symbols;
- the slide 48 8/2 and 4/2 sizing.

Slides that could not be read fully (also in `facts.json → unreadable`):
- **Slide 6:** the numeric axis values of the diode I–V plot are too small to read; only the curve shape is used.
- **Slide 11:** some tiny labels inside the 3D nMOS structure drawing are only partly legible; the readable ones are used.
- **Slide 13:** the same for the 3D pMOS structure drawing.

**Question bank.** 261 questions in `content/topic2/questions/*.ts`, zod-validated:

| type | count | checked against |
|---|---|---|
| do | 49 | live store + layout (`checkTarget`) |
| label | 36 | what you click in the model (focus) |
| predict | 24 | the reveal plays after you commit |
| calc | 26 | number within tolerance, with units |
| recall | 126 | multiple choice or short answer |

Every fact has at least one question; all 104 key facts have two or more of different types. The build test fails otherwise.

**Lesson** (`?mode=lesson&chunk=…`):
- 51 chunks in lecture order, each driving the camera and scene (layer dives, views, fab step, section lock, bench, layout, look-at).
- Each has a short narration, then its question straight away.
- Next unlocks on a correct answer or after the worked solution.
- A wrong answer gives a hint and outlines the relevant part of the model.
- Progress resumes from localStorage; the chunk menu jumps back to any unlocked chunk.

**Revise** (`?mode=revise`):
- Leitner drill over the whole bank, filtered by slide range and topic, with a live box histogram.
- Coverage screen (`rv=coverage`): every slide with its % of facts mastered, grouped by topic; click a slide to drill it.
- Timed exam paper (`rv=exam`): 20 minutes, 14 calc/recall questions, marked with worked solutions.

**Mastery overlay** (Explore → "mastery"): tints each cell object weak / learning / strong / untested; clicking a weak part opens its lesson chunk.

**Phones:** the learning panel is a bottom sheet that collapses to a strip so the model and its controls stay usable.

**Verification**
- 227 tests pass (92 new). They cover:
  - fact coverage and key-fact type diversity;
  - all 49 `do` questions unsolved at setup and solved by their solution, against the real store and layout;
  - all 36 `label` answers clickable in their scene;
  - predict reveals change the scene;
  - grading, tolerance and normalisation;
  - the lesson completed start to finish against live state;
  - Leitner promotion, scheduling and filters;
  - mastery and coverage;
  - exam composition.
- `scripts/lessonrun.mjs` walks all 51 chunks in the real UI. Every chunk showed its question with Next locked, and Next unlocked only after the solution. All 51 were recorded in localStorage. No page errors.
- `scripts/learnshots.mjs` exercises each type for real:
  - do (lattice and layout edit);
  - predict (commit, then reveal);
  - calc (wrong with hint, then right);
  - label (wrong click with hint, then right, in the slide 27 section);
  - recall (wrong, then solution);
  - the coverage screen, exam sitting and marked, the mastery overlay, and the weak-part click opening its lesson.

  (Superseded by the section lesson screenshots below.)
- Fixed after review:
  - an infinite store-update loop when a `do` question solved itself;
  - label clicks swallowed by the Section-view drag;
  - ghosted and x-rayed geometry intercepting clicks;
  - section callouts and truth tables giving answers away;
  - a cramped Layout drawing beside the lesson panel;
  - a cut-off question sheet and scale-bar collision on phones.
- The entry bundle is unchanged (76 KB gz).

**Open**
- Recall is 48 % of the bank; see DECISIONS.md for why.
- The mastery tint is 3D on the cell layer only; other layers show it in the parts list.
- Lesson deep links bypass the sequential gate by design.
- Progress is per browser (localStorage), not synced.

### Source modal, private slides, password — done (2026-11-21)

- **No inline slide references.** Every "(slide N)" and slide chip is gone from panels, the fab timeline, the logic bench, the Layout view, the lesson and all questions. There is now one **Source** button per panel, step and question, which opens the slide image captioned "Topic 2 · slide N". References are `{topic, slide}` (`src/sources.ts`).
- **Slide images.** `npm run slides` renders 49 JPEGs into the gitignored `private/` folder. The build fetches them from private storage (`SLIDES_ARCHIVE_URL`, optional `SLIDES_TOKEN`) when they are not on disk. The repo test fails if a PDF or slide image is ever tracked.
- **Password.** `middleware.ts` puts HTTP basic auth on every route and asset against `SITE_PASSWORD`. When the variable is unset it fails closed with a 503.
- **Verified:**
  - the modal shows the right slides, with a pager for multi-slide panels;
  - dev serving refuses path traversal;
  - an authenticated archive fetch works: a wrong token gives 403 and the build continues without slides;
  - `dist/slides` gets all 49 images.
- **Archive uploaded** as a release asset in the private repo `Bumsparkle/nanoscale-atlas-slides` (see DECISIONS.md).
- **Still to do by hand:** set `SITE_PASSWORD`, `SLIDES_ARCHIVE_URL` and `SLIDES_TOKEN` in Vercel.

### The section lesson — done (2026-11-21)

**Structure.** 15 sections, 59 teaching steps, 66 step checks and 58 review questions; 115 minutes estimated in total.

| § | section | steps | words | est. min | model-based checks |
|---|---|---|---|---|---|
| 1 | Silicon: from chip to crystal | 4 | 540 | 7.5 | 6/7 |
| 2 | The p-n junction | 3 | 390 | 6.6 | 5/7 |
| 3 | Inside the junction: charge, field and bands | 4 | 517 | 9.5 | 9/10 |
| 4 | The MOS transistor | 4 | 469 | 7.7 | 7/8 |
| 5 | pMOS, supply voltage and switches | 3 | 338 | 6.3 | 6/7 |
| 6 | The CMOS inverter | 3 | 316 | 6.2 | 6/7 |
| 7 | NAND and NOR | 5 | 504 | 8.7 | 7/9 |
| 8 | From circuit to silicon | 5 | 529 | 8.8 | 8/9 |
| 9 | Oxide and lithography: the first cycle | 5 | 484 | 9.3 | 10/10 |
| 10 | Forming the n-well | 3 | 300 | 5.5 | 5/6 |
| 11 | The gate stack | 3 | 307 | 6.9 | 7/8 |
| 12 | Self-aligned source and drain | 5 | 400 | 8.2 | 7/9 |
| 13 | Wiring the chip | 3 | 208 | 5.7 | 5/7 |
| 14 | Layout and λ | 5 | 501 | 9.4 | 8/10 |
| 15 | Design rules | 4 | 388 | 8.8 | 9/10 |

The old lesson had 1,662 words of narration and 51 questions; the new one has 6,191 and 66 (plus 58 in reviews). All 173 facts are taught. The bank is now 327 questions: the 261 slide questions plus 66 step checks.

**Flow:**
- The section intro gives the time estimate and the step list.
- Each step teaches: why-focused text, a worked example or model demo, and its Source button, while the model is driven to the step's scene.
- "Check your understanding" folds the text into a "peek" bar and the question takes over the panel, one question at a time.
- **Wrong answers:**
  - a wrong answer brings a hint and an outline on the model, then a second try;
  - a second miss brings the worked solution;
  - wrong multiple-choice options are disabled.
- A peeked right answer is recorded as `peeked`: it keeps its Leitner box and is due again now, so it doesn't count as mastered.
- After the last step comes the mixed section review, then a summary with the first-try score and a note that missed questions are now first in Revise.

**Verification:**
- `src/learn/lesson.test.ts` enforces the structure, the length, fact coverage, the model-check ratio, review mixing, completion against live state, label and hint objects, and the "no word matching" rule.
- 289 tests pass (288 plus the separately run perf test). The perf test passed on its own run; it is still sensitive to machine load.
- `scripts/lessonrun.mjs` walked all 74 positions in the real UI: 59 steps, 66 checks and 15 reviews. Next was locked before every check, the step text was folded during checks, and every section summary appeared. All 74 positions were recorded in localStorage. No problems, no page errors.
- `scripts/learnshots.mjs` screenshots were reviewed and saved in `docs/screenshots/learn/`. They show:
  - the section intro and a worked example;
  - a check with the text folded, then peek;
  - a calc wrong then right;
  - a label wrong click with its hint;
  - a predict reveal;
  - a recall with the wrong option disabled, then the solution after two misses;
  - a review and the section summary;
  - coverage, exam and mastery.
- The Source-modal screenshot is kept out of the repo because it shows a lecture slide.

### Visibility, UI clean-up, animation speed — done (2026-11-21)

**Theme.** The lifted dark theme ships, after a full trial of a light "cleanroom" theme at every layer; the comparison sheets are in `docs/screenshots/theme/` and the reasoning in DECISIONS.md. The changes:
- the background is now a deep grey (#1d2124), with panels a step lighter;
- every layer has key, fill and rim lights, a hemisphere light and a brighter lab environment, with exposure at 1.18;
- material albedo is raised;
- the confusable pairs differ in hue: n-well blue vs p-substrate grey, n+ sky vs p+ copper, pale oxide vs brown poly.

**Contrast.** Body text is AA (4.5:1 or better) on every surface. Labels, readouts and signal colours are 3:1 or better. Nothing is below 12px. These are enforced by `src/styles/contrast.test.ts`.

**UI clean-up.**
- One place per kind of control: modes at the top, scene tools at the bottom centre (views, speed, mastery, hint), info on the right, scale at the bottom left.
- One spacing scale, border and radius; most dividers replaced by spacing; panel prose capped at 65ch; quiet hover and selected states.
- The scale captions no longer crowd the bar.
- The phone top bar is a two-row grid.
- The transistor's "body" label no longer collides with "drain".

**Overlaps.** `scripts/themeshots.mjs` finds none at 1440×900, 1280×800 or 375×812 across 16 screens (every layer, the section, masks, fab, logic, layout, a lesson step and check, Revise and Coverage). Before, it found 14.

**Fab replay speed** (revised: the fab replay only). The previous / play-pause / next controls and a 0.25–2× speed slider (snapping at ¼, ½, 1 and 2×) pop up in the scene tools in the Fab view. They drive playback and every fab effect. Everything else runs at its natural 1×. In the Fab view, `[` and `]` step the speed and space plays or pauses. The speed is remembered. Sound has been removed.

**Verification.**
- All tests pass, including `timescale.test.ts`: a fab step at 0.5× takes 2.0× as long, and 2× and ¼× are covered.
- The build is clean.
- `scripts/speedcheck.mjs` passed all seven checks in the browser:
  - a fab step takes 1.43 s at 1× and 3.05 s at 0.5×;
  - device physics runs at 1.00 while the fab speed is 0.25×;
  - logic transitions are identical at any fab speed;
  - the controls appear only in the Fab view;
  - the keys work;
  - the speed is remembered.
- Before and after screenshots were reviewed at every size; the sheets are in `docs/screenshots/theme/`.

**Revision (2026-11-21).** The models are back to their original dark materials and lighting, on the new grey background. The mastery toggle is at the top left beside "parts". There are still no overlaps at 1440, 1280 or 375 across the 17 review screens, mastery-on included.

### Desktop app — done (2026-11-21)

**The app.** Tauri v2 packages the app as a Mac app with a native glass window (vibrancy, following the system appearance), a hidden title bar, inset traffic lights and a draggable top strip. In the app, the scene floats on the glass over a faint tint, and the panels are more opaque. The web build is unchanged.

**Verified in the installed app** (installed from the .dmg into /Applications):
- it launches;
- WebGPU is active at 50–60 fps, and the WebGL 2 fallback works via `?gl=webgl`;
- a full reload on a deep route works;
- the wafer, die, cell (Section, Fab replay and controls, Logic, Layout), transistor, oxide and lattice all work;
- Lesson works, including a check with the two-try hint flow;
- Revise works, and its drill counts the lesson answer;
- the Source buttons are hidden (no slides bundled), and the binary embeds no slide paths.

**Glass screenshots.** The planned screenshots on three wallpapers (light, dark and busy, shown behind the window in Preview) were not taken. They need full-screen capture, which was not granted. The user reviewed the app and was happy with it. Their follow-up (no brown wafer backdrop; about 17 % less tint) is applied.

**Personal build.** `INCLUDE_SLIDES=1 npm run tauri build` bundles the 49 slides from the local private folder. A default build bundles none, and a guard fails the build otherwise.

### Releases and updates — done (2026-11-21)

- **Release workflow.** Pushing a `v*` tag builds a universal .dmg, checks the bundle for slides and PDFs, and publishes a GitHub Release with commit-based notes, the .dmg, the signed updater bundle and `latest.json`.
- **Updater.** The app checks the latest release on launch and offers to update.
- **Download link.** The home page's "Download for Mac" link always resolves to the newest .dmg, and is hidden in the app.
- **Docs.** The README covers releasing (bump the three versions, tag, push) and the key setup.
- **Verified locally.** The universal build with updater signing produces the .dmg, `.app.tar.gz` and `.sig`. `latest.json` generates. The slide/PDF guard passes the real bundle and fails a planted slide and PDF.

**v0.2.0 released (2026-11-21).** Run 44950491285 passed every step, including the bundle check, and published https://github.com/Bumsparkle/nanoscale-atlas/releases/tag/v0.2.0. The release holds the universal .dmg (12 MB, also under a fixed "latest" name), the signed updater bundle and `latest.json`. Its notes list the commits since the start of the history.

Checked after publishing:
- `releases/latest/download/Nanoscale-Atlas-macOS.dmg` and `latest.json` resolve publicly;
- the downloaded .dmg contains a universal binary (x86_64 and arm64) at version 0.2.0;
- it has no slide or PDF paths.

The in-app update offer can only be seen once a v0.2.1 or later exists.

### Topics 3 and 4 · Step 1: fact inventories — done (2026-11-21)

- `content/topic3/facts.json`: 142 facts (81 key) over 32 slides; 7 slide errors corrected; 11 slides linked to the Topic 2 facts they repeat.
- `content/topic4/facts.json`: 96 facts (63 key) over 21 slides; 3 slide errors corrected; slides 3 and 5 are photographs with nothing examinable.
- Every slide was read in full, including the images (Topic 4's periodic table on slide 12 and the redox table on slide 19, the k0 table, the yield graphs). The corrections and the partly unreadable figures are listed in DECISIONS.md.
- The schema now accepts `t3-`/`t4-` ids, a `corrects` field, `links` and `noFacts`. `src/learn/facts.test.ts` checks slide coverage, ids, key rules, links and that no corrected error is taught.
- `npm run slides` renders all three decks into the gitignored `private/slides/`.

### Topics 3 and 4 · Steps 2–4: Chapters 2 and 3, lessons and Revise — done (2026-11-22)

**Chapter 2, From sand to wafer (Topic 3)**
- New layers: sand (with metallurgical-grade Si), the Siemens reactor and the crucible charge, the Czochralski puller, a float-zone tab, the ingot and the ID saw.
- The puller: drag k0 (with dopant presets from slide 17's table) and the pulled fraction. The ingot is coloured by Cs/C0 from the segregation equation, and the linked graph reproduces slide 19's curves.
- Float zone: zone position and 1–3 refining passes.
- Lattice tabs:
  - unit cells, with SC, BCC and FCC, and diamond as a second FCC cell sliding in by a/4;
  - Miller planes: type h k l to see the plane, its lit atoms, the normal and the sheet density; there is also an intercepts tool;
  - bands: a spacing slider drives the atom clouds and a slide 9 chart, plus a metal / semiconductor / insulator strip;
  - defects: a vacancy and an interstitial, with C_V* and C_I* against temperature.
- Wafer "Process flow" tab: slide 24 as a clickable flow chart. Each step runs in the process lab, which shows:
  - oxidation, with dry/wet, T, t, Deal–Grove and the interface moving into the Si;
  - positive vs negative resist;
  - isotropic undercut vs anisotropic etch against line width;
  - predeposition and drive-in, with D = D0·exp(−Q/kT) and the profile chart;
  - implantation and the anneal;
  - CVD and MBE epitaxy;
  - thermal evaporation.
  
  Each step links to the matching step of the inverter fab.

**Chapter 3, Keeping it clean (Topic 4)**
- The home sequence is real content: gowning follows slide 8, and the doors open onto the cleanroom.
- Cleanroom room tab: ceiling HEPA filters with the RAH above, airflow tracers looping through the bay, floor and service chase, a 1 ft³ box showing the class count, and switchable people, book and gloves as particle sources.
- Wet bench: the RCA sequence with ratios, temperatures and times. Contaminants disappear from the wafer close-up step by step, and a chemical oxide is left by the H₂O₂.
- Redox ladder: slide 19's potentials. Pick a metal and water / H₂O₂ / O₃ to see whether it dissolves or plates out.
- Gettering (wafer tab): PSG, devices, denuded zone, intrinsic gettering bulk and backside. Run the temperature cycle, then kick out, migrate and trap the metal atoms.
- Yield (wafer tab): a live die grid. D0, chip area and C sliders scatter clustered killer particles; Poisson and negative binomial are compared on a slide 16-style chart.

**Lessons and Revise.** The lessons, question counts and engine changes are listed in DECISIONS.md.
- Every lesson check passes the rules the Topic 2 lesson had: interactive at least half the time, no matching words, reviews mixing sections, completable against live state.
- Revise filters by topic.
- Coverage has a skill map per chapter.
- Exam papers draw from any topic, with fresh numbers in the parameterised calculations.

**Verification**
- 483 tests pass, all the original Topic 2 tests included. New tests:
  - the Topic 3 simulator upgrades: 0.44 consumption, resist polarity, isotropic undercut, lateral diffusion, implant damage and anneal, epitaxy, evaporation;
  - growth physics: segregation conservation, defects at 1000 °C, bands, Miller indices and sheet densities, Deal–Grove, diffusion and dose conservation, zone refining;
  - cleaning physics: RCA, redox, Poisson and NB yields against slide 16's graph, and the sampled yield matching both formulas;
  - the inventories, the parameterised calculations and both new lessons.
- `scripts/zoomcheck.mjs` scrolled from sand to the lattice through all 12 layers with no page errors. The scale read 13 mm, 2.4 m, 3 m, 1.9 m, 1.7 m, 8.6 m, 247 mm, 4.4 mm, 19 µm, 5.2 µm, 6.8 nm and 2.5 nm.
- Screenshots of every new scene and tab (`scripts/chaptershots.mjs`) and of every lesson question type and Revise screen (`scripts/learnshots3.mjs`) were reviewed. Fixes found that way:
  - shard-like sand grains;
  - a puller cut-away facing away from the camera;
  - black metals on the saw and wafers;
  - too-close cameras on the polysilicon, wafers and gettering scenes;
  - process-lab panels collapsing;
  - labels under panels;
  - unformatted numeric answers.
  
  The screenshots stay in the gitignored `shots/`.
- **Slides:** the three-deck archive is uploaded to the private release (asset 778978728). To show Topics 3 and 4 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to it (see DECISIONS.md).

### Topics 5 and 6 · Chapters 4 and 5 — done (2026-11-23)

**Chapter 4, Laying down films (Topic 5).** The deposition bay, reached from the cleanroom:
- CVD tab: a hot-wall tube whose wafers lie on a tilted susceptor at atmospheric pressure and stand in a boat at low pressure. Gas tracers, the regime label and a log-rate vs 1/T chart with the kS and hG lines (slides 15–22).
- Plasma tab: PECVD, DC, RF and magnetron in one chamber, with glow, sheath, target and magnets.
- Evaporation tab: a bell jar whose vapour rays go straight below 10⁻⁵ Torr and scatter above it; e-beam source; slide 40's vacuum table highlights the current row.
- Step coverage tab: a trench coated by CVD, sputtering or evaporation, with aspect ratio and sticking coefficient.

**Chapter 5, Atom by atom (Topic 6).**
- Si epitaxy tab: a barrel reactor and the autodoping profile, with temperature, rate, substrate dopant, backside seal and reduced pressure.
- MBE chamber: four cells with shutters, beams, rotating substrate, RHEED gun and screen. The screen pulses once per monolayer and the panel plots the RHEED trace live.
- Growing surface: the three growth modes (islands shaded by height) and lattice mismatch, with a clickable bandgap–lattice-constant chart, substrate choice and thickness: strained until it relaxes with misfit dislocations.
- SOI (wafer tab): smart cut in six steps.

**Verification**
- 611 tests pass (128 new): the films physics, the inventories and their corrections, 233 new questions with eight new parameterised calcs, and the Chapter 4 and 5 lessons under the same rules as Chapters 2–3.
- `scripts/zoomcheck.mjs` still walks sand → lattice through 12 layers with no page errors; MBE → surface and back out to the sand also works.
- Screenshots of every new tab were reviewed (`scripts/chaptershots.mjs c4|c5`). Fixes found that way: the smart-cut stack was upside down (refs not re-rendering), the MBE cut-away faced away from the camera, the surface cameras were too close, islands were indistinguishable from the wetting layer, the trench film matched the substrate, a CVD label hid under the panel, and LPCVD used the APCVD silane fraction.
- **Slides:** all five decks render; the 137-slide archive is local and gitignored. It is not uploaded yet.
- **Slides (2026-11-24):** the five-deck archive (137 slides) replaced `slides-all.tar.gz` in the private release, as asset 786486636. To show Topics 3–6 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/786486636` and redeploy.

### Topics 7 and 8 · Chapters 6 and 7 — done (2026-11-24)

- **Step 1, inventories:** `content/topic7/facts.json` (92 facts, 76 key) and `content/topic8/facts.json` (72 facts, 61 key). Every slide was read, including the images: roadmap table, optics diagrams, MTF plots, resist flow, TEM/AFM/STM images, DoS plots and equations. Nine slide errors are corrected (DECISIONS.md), and `facts.test.ts` re-derives the DOF example, the de Broglie wavelengths and the 1D/2D DoS prefactors.
- **Steps 2–3, scenes (one commit, as they share the store, layer and route plumbing):**
  - **Chapter 6, Printing smaller:** the lithography bay (`/litho/stepper`), with tabs for the exposure tool, diffraction, MTF, proximity gap, resist process, roadmap and next generation. The e-beam writer (`/litho/ebeam`) has direct write, lift-off and the proximity-effect Monte Carlo, plus a marked SEM link point.
  - **Topic 2 link:** the layout view can print the poly with any tool. The simulator's `expose` has an optical mode (the aerial image against the resist threshold), so a coarse tool washes the gates out on the layout and in the 3D cell. Chapters 1–5 stay in ideal mode.
  - **Process lab:** gains the full eight-step resist process.
  - **Chapter 7, Quantum structures:** the III–V MBE chamber (`/nano/mbe`), then a zoom ladder: sample (with the nanoscale entry), layers (and a TEM view), band diagram (with type I/II alignment), and wavefunctions (free electron, infinite and finite wells, well → wire → dot, density of states). A fabrication layer (`/nano/fab`) covers etched and split-gate wires, VLS nanowires, pillars, colloidal dots, patterned growth, Stranski–Krastanov growth and the QD laser.
  - **Correction found while building:** the slide's 1D density of states is half the true value (N = 2kL/π, not kL/π). It is corrected and tested.
- **Step 4, learning:**
  - 276 new questions (153 + 123), with 26 new parameterised calculations, each with a worked solution.
  - Lessons of 9 and 8 sections.
  - Revise covers every fact; every key fact has at least two question types.
  - An all-processing exam paper (Topics 2–8).
- **Verification:**
  - 765 tests pass. The new tests cover the optics formulas, the aerial-image exposure (KrF prints the 0.6 µm inverter, a g-line tool cannot, the fitted f shrinks with λ), the Airy and Rayleigh numbers, MTF trends, Fresnel ringing, the Monte Carlo ranges, the well solvers (infinite-well energies exact, finite below infinite, finite differences agree with the exact solution), the DoS formulas and k-space counts, the slide corrections, and the processing paper.
  - The type-check and production build are clean.
  - `zoomcheck.mjs` still walks sand → lattice with no page errors. The Chapter 7 dive chain MBE → sample → layers → bands → wavefunctions works, and was fixed so the sample's scale tab also dives.
  - `lessonrun.mjs` walks both lessons in the real UI: Chapter 7 with no problems (37 positions). Chapter 6 completes all 43 positions, then the script times out while the app hands over into Chapter 7. That is a script timing issue; Chapter 7 walked on its own passes.
  - Every new tab was screenshotted (`chaptershots.mjs c6|c7`, 39 views) and reviewed. Fixes found that way:
    - camera homes reset by the renderer start-up;
    - per-tab scale bars;
    - the projection lens ring standing on edge;
    - the k-space octant and disc on the wrong side;
    - band diagrams drawn too tall to see;
    - overlapping InAs islands;
    - labels under the panel or the top bar;
    - the 3D cell not picking up the print settings outside the Layout view.
- **Slides:** the seven-deck archive (242 slides) is uploaded to the private release as asset 786861401. To show Topics 3–8 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/786861401` and redeploy.

## Light theme (2026-11-24)
- **Shipped:** a light "cleanroom" theme beside the dark one, with a sun/moon icon and a single mode icon (Explore → Lesson → Revise) floating at the top right. It follows the system until chosen, is saved in localStorage, and doesn't flash on load. The Mac window's glass follows the theme. Design and reasoning are in DECISIONS.md.
- **Coverage:** every hard-coded colour in the UI and scene code moved to tokens:
  - about 80 CSS literals onto CSS custom properties;
  - about 600 scene literals onto the 334-token scene palette;
  - the 2D plots, band diagrams, layout view, process-lab sections, skill map and slide viewer read CSS tokens.
- **Tests:** 783 unit tests pass, with three new suites: contrast for both themes, palette rules, and no stray colour literals.
- **Checked in the browser:**
  - live theme switching, with no console errors;
  - persistence across reloads;
  - System following an OS appearance change. The first emulated change in the browser pane didn't fire, but every later one did; most likely an emulation quirk, but not confirmed.
  - the mode cycle;
  - phone layout at 375 px.
- **Screenshots:** `scripts/themeshots.mjs` now shoots every layer and every tab (70 screens: 3D scenes, plots, band diagrams, lesson, Revise, the skill map, slides, home) in both themes at 1440 and 375, and pairs them with `scripts/montage.mjs`. A first five-screen dark/light review (cell, section, cleanroom, band diagram, skill map) looked right.
- **Review:** the full pass (72 screens × 2 themes × 1440 and 375) was reviewed as dark/light pairs. Fixes (DECISIONS.md, "Screenshot review fixes"):
  - the light focus/hover outline, which wasn't drawing;
  - glass behind the scale and the scene-tools hint;
  - stronger translucent signal sheets;
  - deeper exposure light, X-ray and lamp colours;
  - gettering, DoS and colloid tweaks.

  Every fixed screen was re-shot at both sizes and checked. The slide-viewer step in the script was also fixed (it passed the wrong source shape).
- **Open:** the Mac app itself hasn't been run with the new theme.


## Access gate and accounts (2026-11-24)
- **Shipped:**
  - the basic-auth password is gone. `/gate/` is the cleanroom door with an access-code field, then UCL sign-in (magic link, 6-digit code, or password). Every other route, asset and API needs both gates.
  - Supabase Auth, Postgres and Storage. There are six user tables with RLS, a rate-limit table, and the UCL-only hook and trigger, all as migrations in `supabase/`.
  - local-first sync in `src/sync/` has replaced localStorage persistence for progress, attempts, mastery and settings. The first sign-in offers to import old browser progress.
  - an account menu: sync state, summary, export JSON, privacy, sign out, delete account.
  - a privacy page at `/gate/privacy`.
  - slides now live only in a private bucket, behind 5-minute signed URLs. `scripts/fetch-slides.mjs` and `INCLUDE_SLIDES` are removed, and `npm run slides:upload` replaces them.
  - Mac app: the same gate in the window, session and access token in the Keychain.
- **Tests:**
  - `npm test`: 812 pass, including new suites for the middleware, `/api/access`, sync and import.
  - `npm run test:db`: 23 pass against local Supabase: RLS across users and anon, append-only attempts, private bucket, cascade delete, non-UCL refused on every path (the admin API too, after adding the trigger), rate limit across instances, sync and import end to end.
- **Checked in the browser (local Supabase):**
  - wrong code, then rate limit, then the right code; non-UCL email refused.
  - magic link sign-in; password sign-up confirmed with the emailed code.
  - import prompt → rows in Postgres; theme change synced.
  - a slide opened through a signed URL.
  - account deleted (rows gone, back at the door).
  - `npm run preview` of the production build: assets and API give 401, pages redirect, only `/gate/*`, the favicon, OG image and robots.txt are public. No access code or service key in `dist/`.
- **Screenshot review (dark and light, 1440 × 900):** code step, sign-in, password, code entry, account menu, delete confirmation, privacy. Fixes:
  - the door windows showed through the translucent card: it is now solid glass with blur.
  - the door plates collided with the taller form: moved lower, and hidden on short windows.
  - "Create account" said "signing in…" while busy.
- **Open:**
  - the Mac app's gate and Keychain were not driven by hand. The Rust side builds and the app launched, but window control was declined.
  - the deployed site needs the hosted Supabase project, Vercel env vars and the repository variables (README "Supabase setup") before it works end to end. Until then the new middleware fails closed (503).
- **Deployed (2026-11-24)** to https://nanoscale-atlas.vercel.app on the integration's Supabase project `fsrhpubygmipnenlgsbq`:
  - migrations pushed; auth config pushed (site URL, redirects, 6-digit codes, the UCL hook) without the email templates (see below);
  - `SITE_ACCESS_CODE` and `ACCESS_COOKIE_SECRET` set for production and preview (the code is in the gitignored `ACCESS-CODE.local.txt`);
  - 242 slides in the private bucket; GitHub variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SITE_URL` set for the Mac release build.
- **Outage:** the first deploy returned 500 everywhere for about 10 minutes (extensionless server imports under Vercel's Node ESM). Fixed in c06fb85 and guarded by a test.
- **Live checks, 14/14:**
  - wrong code 401; right code gives a Secure httpOnly cookie; the app gets a token with CORS;
  - signed-in page served; gated asset refused with either gate alone;
  - signed slide URL works and the slide is not public;
  - RLS read and write blocked across two users; non-UCL sign-up refused;
  - account deletion removes the rows.
  Run with throwaway admin-created users, deleted afterwards.
- **Open on the live site:**
  1. **Email delivery.** Supabase's built-in mailer only sends to members of the Supabase organisation and only a few an hour, so students won't receive sign-in emails until a custom SMTP sender is configured (Authentication → SMTP). After that, `supabase config push` the templates so the emails also carry the 6-digit code the Mac app needs.
  2. The Mac app's sign-in hasn't been driven by hand.
  3. `SITE_PASSWORD`, `SLIDES_ARCHIVE_URL` and `SLIDES_TOKEN` are still set on Vercel but no longer read.

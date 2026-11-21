# Nanoscale Atlas — progress log

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

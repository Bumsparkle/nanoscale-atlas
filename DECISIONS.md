# Decisions

Ambiguities resolved during the unattended build. Each entry: decision, why, and what it affects.

## Versions (checked 2026-11-20 against the npm registry)

Pinned exactly: `three@0.187.0`, `@react-three/fiber@9.8.2` (v9 stable; v10 is still alpha), `react@19.3.1`, `vite@8.3.7`, `vitest@5.1.0`, `typescript@6.0.3`, `zustand@5.1.0`, `gsap@3.15.1`, `zod@4.6.7`, `@playwright/test@1.65.1`.

- **TypeScript 6.0.3, not 7.0.2.** 7.0.2 (the native-port compiler) was published the same day as this build; 6.0.3 is the newest release older than two weeks.
- **Vite 8.3.7 rather than 8.3.8**, same reason (8.3.8 was days old with no fixes we need).
- **No `@react-three/drei`.** The brief allows only its renderer-agnostic helpers. The camera has to be a spring rig driven by app state (brief: "the camera is derived from state"), and DOM panels live outside the canvas, so `CameraControls` and `Html` would be unused weight. A ~150-line spring orbit rig replaces it.

## Slides vs. the brief vs. physics

- **Slide 48, "Length / Width = 4λ/2λ".** The slide's two sentences agree with each other: "Length / Width = 4λ/2λ" and "0.6 µm wide, 1.2 µm long" both give L = 1.2 µm, W = 0.6 µm. They conflict with slide 46, which defines f (= 2λ) as the source–drain distance, i.e. the channel *length*, and with every drawn layout (slides 27, 48), where the poly crossing the diffusion is 2λ wide and the diffusion under it is 4λ. The Atlas shows **L = 2λ = 0.6 µm, W = 4λ = 1.2 µm** (the usual W/L = 4/2 convention). The minimum-transistor panel quotes the slide and states the discrepancy: "the slide text says L = 1.2 µm and W = 0.6 µm; the drawn layout gives L = 0.6 µm and W = 1.2 µm". (Corrected 2026-11-21: an earlier version of this entry said the slide's numbers swapped its own words.)
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
- **Gate oxide is one object.** In the slides' flow the thin oxide is grown everywhere, then cleared except under the poly (slides 37–38), and there is no field oxide underneath. So it sits under the whole poly U, bridge included, and forms one connected piece. The panel says so.
- **No isotropic etch flag.** The brief lists one ("adds undercut"). The slides draw every etch with vertical walls (33, 38, 40, 44), and sub-λ undercut can't be shown on a 1λ column grid without voids under the resist. Cut from M2. If it's added later, it needs a `void` material in the column model.
- **Layout dimensions.** Slides 27–28 are not dimensioned, so the λ coordinates in `masks.ts` were drawn for the Atlas: diffusions 4λ wide, gates 2λ, contacts 2λ, metal 4λ, all at or above the slide 47 minimums (verified in `rules.test.ts`). The cell is 62λ × 28λ including the metal rails.
- **Three.js shell loads after the door paints.** On `/` the 3D chunk is fetched on idle so the home page paints first (Lighthouse mobile FCP 3.7 s → 2.3 s); deep links load it at once.
- **Camera distance in log space.** The dolly spring integrates log(distance), so zoom speed is uniform on the log scale bar and dives across two orders of magnitude (transistor → oxide) stay smooth.

## Deploy (2026-11-21)

- **Vercel, static SPA from GitHub.** `vercel.json` pins `framework: vite`, `buildCommand: npm run build`, `outputDirectory: dist`, and rewrites every path to `/index.html`, so deep links like `/cmos/inverter/nmos?cut=slide27` load on refresh. Vercel serves real files in `dist/` (hashed assets, `og.png`, `robots.txt`) before applying rewrites, so the catch-all only catches app routes. Hashed `/assets/*` get a one-year immutable cache header. No server code, no environment variables.
- **The lecture PDF is never public.** `docs/topic2-cmos.pdf` (UCL material) had been committed in M1. It was removed from every commit with `git filter-branch --index-filter 'git rm --cached …'`, the old refs and reflog expired, and the repo garbage-collected, before any remote existed. `.gitignore` now excludes it and all `*.pdf`. Content still cites slide numbers only.
- **Scratch output left history too.** `shots/` (≈ 62 MB of screenshot runs) and the Lighthouse JSON reports were also purged from history and ignored; curated screenshots stay in `docs/screenshots/`. `.git` went from 59 MB to 23 MB.
- **Build warnings.** The chunk-size warning limit is 2000 kB because the three.js shell is one deliberately lazy chunk (~480 KB gz); the entry chunk is ~75 KB gz. The re-mesh performance test now takes the best of three timed runs after a warm-up, because a single run failed at 8.2 ms against its 8 ms budget while the machine was busy building.

## Layout view (2026-11-21)

- **Masks became layout state.** `chapters/cmos/layout.ts` holds the current layout (the slide 27–28 masks by default). The recipe is now `buildSteps(masks)`, and `processFor(layout)` memoises one `Process` per layout. The 3D cell, cross-sections, fab replay (reticle included) and rule checker all read the current layout. The cell rebuilds when you leave the Layout view rather than on every drag, so dragging stays at frame rate and the 3D model never shows a half-edited state.
- **Rule checks are per edge.** Every check records the rectangle sides it constrains. That makes hover-an-edge, highlight-the-violation and "every edge has a rule" testable.
  - Width checks run in both directions: every rectangle side is covered at least by its own layer's width rule.
  - Touching rectangles of one layer count as one polygon, so no spacing is checked between them (e.g. the metal rail and its arm).
- **Rule interpretations.**
  - Contact size is an *exact* rule (2λ × 2λ, slide 47 draws a fixed cut), reported as "must be 2λ · off by …".
  - The diffusion/poly surround of a contact uses whichever layer sits under it, so a poly contact would also pass.
  - The n-well rule applies to every diffusion: those inside need 6λ to every well edge, and those outside within 18λ need a 6λ gap.
- **Metal2 and vias** are in the slide 47 table but not in this cell. They have checker functions and tests, and the Layout panel says they are unused.
- **Camera.** The Layout transition is a dolly-zoom: field of view 32° → 2.5° (log-space spring) while the camera rises to straight down, so the 3D cell flattens into a near-orthographic plan. The frame is computed to match the SVG drawing (`ui/layoutFrame.ts`), and the flat drawing fades in over the settled view. Leaving reverses it.
  - A bug found on the way: `camera.filmOffset` (used to keep objects clear of the side panel) works in near-plane units, so at a 2.5° lens it threw the cell 8× off-screen. It is now converted with tan(fov/2).
- **Drawing.** The flat masks are SVG, not WebGL: crisp at any zoom, exact hit-testing on edges, and accessible. Colours follow the slide 25 legend adapted to the dark surface: hatched poly and metal, contacts as black squares with white outlines, a translucent n-well, plus the slide 27 dashed section line.
- **Tight spots** (rules met exactly at the minimum) get a small amber dot at the midpoint of the dimension. Exact rules (contact size) are excluded, since every contact is "tight" by definition.
- **Deep links:** `?view=layout&layers=nwell,poly,ndiff,pdiff,contact,metal` (any subset; omitted = all six) and `&focus=min-transistor` (or `mask-poly`, `lambda`, …). Edited geometry is not put in the URL.

## Lesson and Revise modes (2026-11-21)

- **Final counts.**
  - **Facts:** 173 in `content/topic2/facts.json`, covering all 49 slides. By kind: 48 definitions, 36 cause→effect, 25 diagram readings, 25 rules, 25 process steps, 14 numbers. 104 are key (every number, process step and rule, plus truth-table rows and the cross-section readings).
  - **Questions:** 261 in `content/topic2/questions/*.ts`: 49 do, 36 label, 24 predict, 26 calc, 126 recall. Every fact has at least one question; all 104 key facts have at least two, of different types (build test).
  - **Lesson:** 51 chunks in lecture order.
- **Recall is still the largest type (48 %).** Most recall questions test definitions, cause→effect statements and symbol readings, which have no state in the model to reach or point at (e.g. "ULSI stands for…", "why HF is dangerous", "the NAND symbol is equivalent to…"). Wherever the model has the state, the fact has a do, label or predict question too. Each key fact pairs its recall with an interactive or calc question.
- **Facts are paraphrased, not quoted.** Slide numbers are the PDF page numbers. The slide 48 L/W wording is recorded as the slide states it, with the slide 46 reading alongside, as in the Layout view.
- **Questions are data, checked against real state.**
  - A `do` question names a target from a closed set: gate inputs and output, the switch model, a locked section, a fab step, a layout violation or clean layout with given L, visible masks, gate voltage, lattice state, junction regime, or layer.
  - `checkTarget` reads the live zustand store and the current layout. The build tests apply each question's setup to the real store, assert the target is *not* already met, apply its solution, and assert it is.
  - A `label` answer must be a clickable mesh at that fab step (resolved through the same mesher/content map the cell uses), a Layout-view shape, or a hand-built layer node.
- **Label and predict questions hide give-aways.** While one is open, a `quiz` flag hides the section callouts, hover labels, Layout shape tips, the other truth-table rows and the bench explanation. Clicks select without flying the camera. Answering or opening the solution lifts it.
- **Picking fixes found while testing.** In Section view the parted near half fades to a ghost but still caught clicks. With the mastery overlay on, the faded metal and field oxide hid the parts it invites you to click. Both are now click-through (`CellModel.pickable`). Clicks in Section/Masks views were also swallowed by the drag handler; a press that does not move is now a click.
- **Leitner boxes.** Five boxes.
  - Right on the first attempt moves a card up a box (a new card starts in box 2); any miss sends it back to box 1.
  - Review intervals: box 1 now, then 1, 3, 7 and 21 days.
  - A fact's score is the mean over its questions of (box − 1)/3, capped at 1. It counts as mastered at ≥ 2/3, i.e. its questions are around box 3. Lesson answers feed the same boxes.
- **Lesson gating** (superseded by the section lesson below). A chunk unlocked the next once its question was answered or its worked solution opened.
- **Exam paper.** 14 questions, about 40 % calc and the rest recall, drawn from the current Revise filter. 20 minutes, auto-marked on time-out, with a worked solution per question. Do, label and predict are excluded because they need the model.
- **Mastery overlay.** The 3D tint is on the cell layer, which carries most objects. On other layers the parts list shows a mastery dot per object, and the legend says so. Clicking a weak or untested part opens the lesson step that teaches its weakest fact.
- **Progress lives in localStorage** (`atlas.leitner.v1`, `atlas.lesson.v2`), per browser. Every access is guarded, so a private window just forgets.

## Slide sources, the slide images and the password (2026-11-21)

- **References are `{topic, slide}`, not bare numbers.** `src/sources.ts` defines `SourceRef` and `T2(n)`; every panel, fab step, lesson step and question carries one or more. With `topic` in the reference, Topic 3 can add `T3(n)` without touching the UI. Inline "(slide N)" text and the slide chips are gone. Each panel, step and question has one small **Source** button that opens a modal with the slide image, captioned "Topic 2 · slide N", with a pager when there are several.
- **The slide images are never in the repository.** `npm run slides` renders the PDF with `pdftoppm` (JPEG q84, 1600 px wide, 80–240 KB each, 4.8 MB archived) into `private/slides/topic2/slide-NN.jpg` and packs `private/slides-topic2.tar.gz`. `private/` and `*.pdf` are gitignored, and `src/repo.test.ts` fails if any PDF or slide image is ever tracked.
- **How they reach the deployment.** The archive is uploaded once to private storage (Vercel Blob, a private bucket, or a private GitHub release asset). `npm run build` runs `scripts/fetch-slides.mjs` first:
  - it uses `private/slides` if present (a local build);
  - otherwise it downloads `SLIDES_ARCHIVE_URL`, with `Authorization: Bearer $SLIDES_TOKEN` if set;
  - it rejects archive entries outside `topic*/slide-NN.jpg`, then unpacks.
  
  The Vite plugin copies them to `dist/slides/` after the bundle. Without the archive the build still succeeds, and the Source modal says the image is unavailable.
  
  Rejected alternatives:
  - runtime fetching from Blob: the images would need public or signed URLs outside the password;
  - committing an encrypted archive: the key handling just moves the secret.
- **The whole site is behind HTTP basic auth.** `middleware.ts` is Vercel Routing Middleware with no `matcher`, so it runs on every request: HTML, JS, assets and `/slides/*`.
  - **Fail closed:** if `SITE_PASSWORD` is unset it serves nothing (503), so a misconfigured deployment never exposes the slides.
  - **Credentials:** any username; the password is compared in constant time on SHA-256 digests.
  - **Headers:** `/slides/*` responses get `Cache-Control: private` and `X-Robots-Tag: noindex`.
  - **Tests:** `src/middleware.test.ts` covers missing, wrong and right passwords and the no-matcher rule.
- **Vercel env vars needed:** `SITE_PASSWORD` (required, or the site serves 503), `SLIDES_ARCHIVE_URL` and optionally `SLIDES_TOKEN`.

## The section lesson (2026-11-21)

- **15 sections replace 51 slide-sized chunks.** Each section is one idea in depth, with 3–5 teaching steps and a 3–4 question review. Every step has:
  - an explanation aimed at *why*;
  - an optional worked example or "try it on the model" demonstration;
  - a scene the model is driven to;
  - its sources;
  - the facts it teaches;
  - one check, or two when one is a calculation.
  
  Content lives in `content/topic2/lesson/0N-*.ts`, which exports both `sections` and the step `questions`. The step questions join the bank, so Revise drills them too.
- **Rules enforced by `src/learn/lesson.test.ts`, not by convention:**
  - 12–15 sections and 3–6 steps each.
  - At least as long as the old lesson: 6,191 words against 1,662, and 66 step checks against 51.
  - All 173 facts are taught.
  - Each check tests only facts its step taught.
  - At least half of each section's checks and reviews are do / predict / label / calc. The lowest is 5/7.
  - Each review covers this section and, after the first, an earlier one, and never repeats a step check.
  - The whole lesson completes against the live store.
- **"Not answerable by matching words" is mechanised.** For recall and predict checks, the correct option must not appear in the step text, title or example, and must share no 4-word run with it. For calc checks, the answer value must not appear as a number in the step. Several checks were reworded when the test caught them, e.g. "ion implantation" became "the energy of the ions".
- **Section time estimate:** reading words ÷ 200 wpm, plus ¾ min per check, plus ⅗ min per review question. All sections fall between 5.5 and 9.5 minutes, 115 minutes in total. The estimate is shown in the section intro and menu.
- **Two tries.**
  - A wrong answer shows a hint and outlines part of the model; a wrong multiple-choice option is disabled.
  - A second wrong answer opens the worked solution.
  - "Stuck? get a hint" spends the first try.
  - Predict gets one try, since its reveal is the answer.
  - Any miss counts as a miss for Leitner.
- **Peek.** During a check the step text folds into a bar. Opening it marks the current question as peeked, and a right answer then records as `'peeked'`: the card keeps its box and is due again at once, so it never counts towards mastery.
- **Gating.** A step is done once all its checks are answered or solved. The review is done when finished. Next and the section menu follow `POSITIONS` (steps, then review, per section). Deep links (`?mode=lesson&at=<step id>` or `at=review:<section>`) open any position; the old `chunk` parameter is gone. Lesson progress moved to `atlas.lesson.v2`, since old chunk ids mean nothing in the new structure. Leitner cards are kept.
- **The slide 48 wording trap** is taught explicitly in the "minimum transistor" step, as the Layout view already shows it.

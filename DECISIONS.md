# Decisions

Ambiguities resolved during the unattended build. Each entry: decision, why, and what it affects.

## Versions (checked 2026-11-20 against the npm registry)

Pinned exactly: `three@0.187.0`, `@react-three/fiber@9.8.2` (v9 stable; v10 is still alpha), `react@19.3.1`, `vite@8.3.7`, `vitest@5.1.0`, `typescript@6.0.3`, `zustand@5.1.0`, `gsap@3.15.1`, `zod@4.6.7`, `@playwright/test@1.65.1`.

- **TypeScript 6.0.3, not 7.0.2.** 7.0.2 (the native-port compiler) was published the same day as this build; 6.0.3 is the newest release older than two weeks.
- **Vite 8.3.7 rather than 8.3.8**, same reason (8.3.8 was days old with no fixes we need).
- **No `@react-three/drei`.** The brief allows only its renderer-agnostic helpers. The camera has to be a spring rig driven by app state (brief: "the camera is derived from state"), and DOM panels live outside the canvas, so `CameraControls` and `Html` would be unused weight. A ~150-line spring orbit rig replaces it.

## Slides vs. the brief vs. physics

- **Slide 48, "Length / Width = 4λ/2λ".** The slide's two sentences agree with each other: "Length / Width = 4λ/2λ" and "0.6 µm wide, 1.2 µm long" both give L = 1.2 µm, W = 0.6 µm. They conflict with slide 46, which defines f (= 2λ) as the source–drain distance, i.e. the channel *length*, and with every drawn layout (slides 27, 48), where the poly crossing the diffusion is 2λ wide and the diffusion under it is 4λ. The app shows **L = 2λ = 0.6 µm, W = 4λ = 1.2 µm** (the usual W/L = 4/2 convention). The minimum-transistor panel quotes the slide and states the discrepancy: "the slide text says L = 1.2 µm and W = 0.6 µm; the drawn layout gives L = 0.6 µm and W = 1.2 µm". (Corrected 2026-11-21: an earlier version of this entry said the slide's numbers swapped its own words.)
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
- **Layout dimensions.** Slides 27–28 are not dimensioned, so the λ coordinates in `masks.ts` were drawn for this app: diffusions 4λ wide, gates 2λ, contacts 2λ, metal 4λ, all at or above the slide 47 minimums (verified in `rules.test.ts`). The cell is 62λ × 28λ including the metal rails.
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
- **Where the archive lives (chosen 2026-11-21): a private GitHub release.** A release on the public `nanoscale-atlas` repo would itself be public, so the archive sits in a separate private repo, `Bumsparkle/nanoscale-atlas-slides`, which holds nothing but a README and the release `topic2-slides`.
  - **URL:** `SLIDES_ARCHIVE_URL` is the API asset URL, `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/776184764`, fetched with `Accept: application/octet-stream`. GitHub redirects to a signed download, and the token is not forwarded on that cross-origin redirect.
  - **Token:** `SLIDES_TOKEN` should be a fine-grained personal access token limited to that one repository, with *Contents: read-only* and nothing else.
  - **Verified:** no token gives 404, a wrong token gives 401 and the build continues without slides, and a valid token fetches all 49 images.
  - **Updating the slides:** run `npm run slides`, then `gh release upload topic2-slides private/slides-topic2.tar.gz --clobber -R Bumsparkle/nanoscale-atlas-slides`. A clobbered asset gets a new id, so update `SLIDES_ARCHIVE_URL` from `gh api repos/Bumsparkle/nanoscale-atlas-slides/releases/tags/topic2-slides --jq '.assets[0].url'`.
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

## Visibility, UI clean-up and animation speed (2026-11-21)

- **One theme ships: the lifted dark.** A light "cleanroom" theme (pale grey and white, like the bay itself) was built as a full trial: page tokens, scene backdrop, environment and lights. Both themes were screenshotted at every layer, the section view, a lesson step and check, and Revise (`docs/screenshots/theme/trial-dark-vs-light-*.jpg`). The dark theme won, for three reasons:
  - **Backdrop contrast.** The slide 25 legend paints cut faces in near-whites (p substrate #fafafa, n-well #e3e3e3, SiO₂ #ececec). On a pale backdrop the section, the transistor and the cell's sides merge into the background. On deep grey they stand out.
  - **Signals.** Amber lithography light, the --on conducting-path glow, implant ions and the logic-1 node are emissive. They read as light on grey and as stains on white.
  - **Identity.** The dark instrument-panel look and the amber accent survive intact.
  
  The light tokens, the `?theme=` switch and the scene branch were removed, so nothing toggles. *(Superseded 2026-11-24: a light theme now ships alongside the dark one; see "Light theme" below. The two reasons it failed here are what that design answers.)*
- **Lifted, not just brightened.**
  - **Background:** the scene sits on #1d2124 instead of #0b0c0d. Panels float a step lighter (#262a2e, translucent `--glass`, a soft shadow), so the background, panels and model are three distinct planes.
  - **Lights:** every layer uses one key / fill / rim set. The key is warm, high and front-right; the fill is cool from the left at half the key; the rim comes from behind to separate edges; a weak bounce from below means no face goes black. A stronger hemisphere light and a brighter lab environment (strip ceiling, lit walls and floor) complete it. Exposure is 1.18 (AgX).
  - **Albedo:** silicon albedo is raised and metalness cut (0.32 → 0.08). The pairs that must never be confused now differ in hue, not only value: p-substrate cool grey vs n-well steel blue, n+ sky blue vs p+ copper. Oxide moved from a dark glass to a pale one, so it no longer reads as a hole next to the brown poly. Legend cut faces are lit at 0.68 of the legend colour, up from 0.62; at 0.8 the transistor's faces washed out to white.
- **Contrast is tested, not eyeballed.** `src/styles/contrast.test.ts` checks two things:
  - **Body text and accents:** `--ink-0`, `--ink-1`, `--ink-2`, `--amber-ink` and `--warn` must be AA (≥ 4.5:1) on the scene, on every panel surface and on the translucent glass as rendered over the scene. `--warn` was lightened to pass on `--bg-3`.
  - **Labels and signals:** `--ink-3`, `--on`, `--lo` and `--hi` must be ≥ 3:1.
  
  It also fails if any stylesheet sets a font size under 12px. `--t-11` is now 12px, and the 9–11px literals became `--t-12`.
- **Screen regions.** There is one place for each kind of control:
  - **Top:** the brand, zoom path, mode switch and the motion preference.
  - **Bottom centre:** the scene tools (views, speed, mastery, one hint line).
  - **Right:** info panels.
  - **Bottom left:** the scale, with its captions (field of view, layer note, drawing exaggeration) on separate lines instead of crowding the bar.
  
  Changes this made:
  - The layer hint and exaggeration note no longer float on their own.
  - The fab timeline lost its own play button (the speed bar's play drives it).
  - Mastery moved from the top bar to the scene tools.
  - Panels size themselves from `--top-h`, `--tools-h` and `--timeline-h` instead of a dozen hand-tuned offsets.
  
  `scripts/themeshots.mjs` reports any overlap between HUD regions at 1440×900, 1280×800 and 375×812; it reports none. The full-screen coverage and exam sheets cover the left panel on phones by design and are excluded.
- **One spacing scale, one border, one radius.**
  - **Spacing:** the 4px-based `--s-*` scale, plus two control paddings (`--pad-chip`, `--pad-btn`).
  - **Border:** `--hair` for every neutral border. The 2px amber top rule on panels stays as the accent.
  - **Radius:** a single `--radius` of 4px.
  - **Dividers:** dashed dividers inside panels, review boxes and solutions are gone, and sections are grouped by spacing.
  - **Line length:** panel prose is capped at 65ch.
  - **Hover and selected states:** quiet `--bg-3` fills, with amber only for the selected state.
- **The speed control is for the fab replay only** (revised the same day at the user's request). A first version scaled every content animation from one shared time scale. In use, only the fabrication replay benefits from slowing down, and everything else reads best at its natural speed.
  - **What follows the speed:** fab playback (`scene/playback.ts`), the step spring, and the fab effects (resist spin, exposure, etch, implant ions, deposition), all through `fabDt(dt)` in `state/timescale.ts`.
  - **What stays at 1×:** device physics, logic and junction transitions, the lattice, the die beacon and camera moves. The logic switches and the junction now ease into place rather than jumping; that came from the first version and was kept at 1×.
  - **Where the controls are:** previous / play-pause / next and the speed slider (0.25–2×, snapping at ¼, ½, 1 and 2) pop up in the scene tools only in the Fab view. They replace the timeline's own play button.
  - **Keys:** `[` and `]` step the speed and space plays or pauses, in the Fab view only. The lesson's previous/next keys stay on `<` and `>`.
  - **Remembered:** the speed is kept in localStorage (`atlas.speed.v1`).
  - **Tests:** `src/state/timescale.test.ts` checks that a fab step at 0.5× takes 2× as long. `scripts/speedcheck.mjs` checks the same in the browser, and that device physics and logic transitions ignore the speed.
- **No sound.** The optional sound (snap clicks, fab tool hum, dive whoosh) and its top-bar toggle were removed at the user's request. The top bar's preferences are now just reduced motion.
- **Models back to their original dark look; the background stays grey** (revised the same day at the user's request). The materials, the key/fill/rim lights and the environment were restored to their earlier values, with exposure back at 1.0. Only the backdrop (#1d2124), the die's ground plane and the brighter λ grid keep the lift. So the lifted-albedo bullet above no longer applies to the models. The contrast tests are unaffected, since they test text against surfaces, not the models.
- **Mastery is back at the top left**, beside "parts", with its legend just below. It had briefly moved into the scene tools.

## Desktop app (Tauri v2, 2026-11-21)

- **Tauri v2, wrapping the same Vite build.** `src-tauri/` holds the shell. The app loads `dist/` from `npm run build:app`, which is the normal build with `NANOSCALE_APP=1`. `npm run tauri dev` runs the dev server in the window. The web build, `vercel.json` and the middleware are untouched.
- **Window.** It is transparent with native vibrancy (`underWindowBackground`, which follows the system light/dark appearance). The title bar is hidden as an overlay with the traffic lights inset at (18, 26). The top strip is a `data-tauri-drag-region`. `macOSPrivateApi` is on, because a transparent window requires it. `NANOSCALE_FORCE_THEME=light|dark` overrides the appearance for one run, for screenshots, without touching System Settings.
- **App mode is detected at runtime** (`__TAURI_INTERNALS__`). An inline script sets `html[data-app]` before first paint, and `src/platform.ts` exports `IS_APP`. In app mode:
  - the page, `#root` and the WebGPU canvas are transparent, and the post-processing output keeps the scene's alpha;
  - the scene background is null, and the die's ground plane is hidden;
  - a faint tint (rgba(22,26,29,0.38), 0.48 on a light appearance) sits behind the scene, so model colours read on any wallpaper;
  - panels, labels and the legend use a more opaque glass (0.95 / 0.985);
  - the top bar makes room for the traffic lights.
  
  The web version is visually unchanged. The wafer's warm floor disc was removed everywhere: it showed as a brown backdrop.
- **Renderer.** WebGPU works in the macOS 26 web view (WKWebView), measured at 50–60 fps on the cell. `?gl=webgl` forces the WebGL 2 fallback, which also renders. The `/debug` readout (⌥D, since the app has no address bar) shows the renderer, whether this is the app, and whether slides are bundled.
- **Routing.** Tauri's asset server falls back to `index.html` for unknown paths. A full reload on `/debug?gl=webgl` inside the app came back on the right route.
- **Slides.**
  - The app build bundles slides only with `INCLUDE_SLIDES=1`, a personal build from the local gitignored `private/slides`.
  - Otherwise none are copied, any left in `dist/slides` from a web build are deleted, and `SourceButton` renders nothing (`__SLIDES__` is a build-time constant).
  - `scripts/check-app-slides.mjs` runs after every app build and fails it if slides are present without the flag.
  - **Root cause of two leaks, found by the guard.** Two local builds embedded the slides even without the flag. Vite also calls a plugin's `closeBundle` when a dev or test server shuts down, so a Vitest run during an app build copied the slides into `dist/` just before the Rust compile embedded it. This was confirmed by experiment: one test run with the old plugin put 49 slides in `dist/`, and none after the fix.
  - The fix: the plugin now acts only in a real `vite build`, and never under Vitest. CI could not have leaked, because `private/` is never present there.
- **No password in the app.** The basic-auth middleware is Vercel-only.
- **Icon.** `assets/app-icon.svg` shows the brand mark (a silicon block with an amber gate stripe, n+/p+/n-well patches) as a lit isometric cell on the instrument-grey squircle. `scripts/app-icon.mjs` renders it at 1024 px, and `tauri icon` makes the .icns and PNG set.
- **Unsigned .dmg.** The app is ad-hoc signed (`signingIdentity: "-"`) and not notarised. The README describes signing and notarising later with a Developer ID.
- **Toolchain.** Rust 1.100 was installed via Homebrew's `rustup`, without editing shell profiles.

## Releases and updates (2026-11-21)

- **GitHub Actions builds releases from tags** (`.github/workflows/release-macos.yml`, on `v*`). It runs on `macos-latest` and makes one universal build (`--target universal-apple-darwin`) rather than two per-architecture jobs: one download, one updater bundle, half the CI time. The release body is written from `git log` since the previous tag, because GitHub's own auto-generated notes only list merged PRs and this repo commits straight to main.
- **Fixed asset names.** The workflow uploads `Nanoscale-Atlas-macOS.dmg` (plus a versioned copy), so `releases/latest/download/Nanoscale-Atlas-macOS.dmg` is a permanent "latest" link. The site's "Download for Mac" link on the home page uses it and is hidden in the app.
- **No lecture material in releases, checked three ways.**
  1. `INCLUDE_SLIDES` is forced off in CI.
  2. The job fails if `private/` exists, or if any PDF or slide image is tracked.
  3. After the build, `check-app-slides.mjs` scans the .app files and the asset paths embedded in the executable, the mounted .dmg, and the unpacked updater tarball. It fails on any slide image or PDF.
- **Updater.** `tauri-plugin-updater` 2.14.1 and `tauri-plugin-process` 2.4.0 are installed, with the npm packages pinned to match.
  - On launch the app fetches `releases/latest/download/latest.json` and offers "Update and restart". The prompt is a lazy chunk loaded only when `IS_APP`.
  - `latest.json` is generated by `scripts/updater-manifest.mjs` from the `.sig` the build produces. It lists the universal tarball for darwin-aarch64, darwin-x86_64 and darwin-universal.
  - Updater artifacts are switched on only in CI (`--config '{"bundle":{"createUpdaterArtifacts":true}}'`), so local builds, including `INCLUDE_SLIDES=1`, need no key.
- **Signing key.**
  - Generated with `tauri signer generate`, with a random password.
  - The private key and password live only in `~/.tauri/` (mode 600) and in the repository's Actions secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. They are never committed.
  - The public key is in `tauri.conf.json`.

## Topics 3 and 4: fact inventories (2026-11-21)

- **Two new inventories**, in the Topic 2 format: `content/topic3/facts.json` (Topic 3, *Silicon Growth and Fabrication*, 32 slides) and `content/topic4/facts.json` (Topic 4, *Cleaning and Cleanrooms*, 21 slides). Ids carry the deck: `t3-s17-k0`, `t4-s11-sc1`. Sources stay `{topic, slide}` (`T3(n)`, `T4(n)`), so the Source button reads "Topic 3 · slide 17".
- **Counts.** Topic 3: 142 facts, 81 key. Topic 4: 96 facts, 63 key. Every slide has a fact, a link to a Topic 2 fact, or a stated reason it has none (`src/learn/facts.test.ts`).
- **Overlap with Topic 2 is linked, not duplicated.** Topic 3 repeats parts of Topic 2 (dopants, the PN-junction slide, oxidation, lithography, HF etching, diffusion and implantation). Each inventory has a `links` list naming the Topic 2 facts a slide repeats (e.g. Topic 3 slide 13 → `s07-depletion`, `s07-field`, …). Only what is new becomes a Topic 3 fact: donors/acceptors and majority/minority carriers, the knee voltages, dry vs wet oxidation and the 0.44 consumption, positive vs negative resist, isotropic vs anisotropic etch, predeposition and drive-in, the implant anneal, thermal evaporation. The tests check every link points at a real Topic 2 fact.
- **Slides with nothing examinable:** Topic 4 slides 3 and 5 are photographs (a cleanroom corridor; the EEE MBE system). They are listed in `noFacts`. Slide 4 (LCN photos) gives one fact: lithography bays are lit with yellow light.
- **Partly unreadable or deliberately not taught** (listed in each file's `unreadable`): Topic 3 slide 14's reverse currents (−50 µA Ge, −20 µA Si) are illustrative figure values, not real leakages, so only the knee voltages are taught; slide 16's photo captions; slide 17's k0 values for Te, Li, Cu and Au (read, not taught). Topic 4 slide 13's diffusivity lines are taught as an ordering, not numbers; slide 14's cycle temperatures and slide 17's chip sizes are read off the axes as approximate.
- **Fewer key facts than kinds would suggest.** Numbers, process steps and rules are always key (tested). Definitions, cause→effect statements and diagram readings are key only when they are central to the topic (e.g. the diamond structure, the three resist/etch distinctions, clustering), so "key facts at least twice" stays meaningful.

### Slide errors corrected (each fact has a `corrects` field with the slide's wording)

| Deck · slide | The slide says | The app teaches |
|---|---|---|
| T3 · 5 | Ball-and-stick drawing labels the bond "0,15 nm" | That is the C–C bond of diamond; Si's bond length is √3a/4 ≈ 0.235 nm |
| T3 · 8 | "No 2 electrons can have the same energy (Pauli)" | No two electrons can occupy the same quantum state (two of opposite spin share a level) |
| T3 · 12 | "Group V atoms (B, P and As) called donors" | Donors are group V (P, As, Sb); boron is group III, an acceptor |
| T3 · 13 | n side exposes "positive donor ions of concentration Na" | Donor concentration is Nd (acceptors are Na) |
| T3 · 15 | Step 1: C + SiO₂ → Si + CO₂ | Overall SiO₂ + 2C → Si + 2CO: at arc-furnace temperatures the carbon leaves as CO |
| T3 · 19 | "the composition initially at K0M0" | The first crystal has Cs = k0·C0 |
| T3 · 28 | Expose "selectively polymerizes"; develop "dissolves the unpolymerized resist" | True only of negative resist. Developing removes whatever is soluble: exposed positive resist, unexposed negative resist |
| T4 · 10 | SC2 removes "Mg³⁺" | Magnesium forms Mg²⁺ |
| T4 · 10 | "Ultrasonic and now megasonic cleaning … (20–50 kHz)" | 20–50 kHz is ultrasonic; megasonic runs near 1 MHz (Kern, *Handbook of Semiconductor Wafer Cleaning Technology*) |
| T4 · 19 | O₂/H₂O: 2H₂O ⇌ O₂ + 4H⁺ + 2e⁻ | Four electrons: 2H₂O ⇌ O₂ + 4H⁺ + 4e⁻ |

`facts.test.ts` asserts the correct versions and that no statement repeats a corrected error.

### Read as the lecture gives it (not errors)

- **T3 slide 16, "close to 1415 °C".** Silicon melts at 1414 °C; the slide's round figure is kept, with the melting point named.
- **T3 slide 10, "metal conduction band is half filled".** True for alkali metals; the figure shows overlapping bands instead. The fact states both ("half filled, or overlapping").
- **T4 slide 19 potentials.** Some values differ from modern standard tables by up to ~0.2 V (Fe³⁺/Fe 0.17, Mn²⁺/Mn 1.05). The ordering, which is what the slide argues from, is the same, so the lecture's numbers are taught.
- **Cleanroom classes.** Slide 2 says particles per cubic metre, slide 7 per cubic foot ≥ 0.5 µm. Both are used: the class number is the US FED-STD-209 per-ft³ count (slide 7).
- **Slide images.** `npm run slides` now renders every deck found in `docs/` (gitignored) into `private/slides/<topic>/` (gitignored) and packs `private/slides-all.tar.gz`. To show Topic 3 and 4 slides on the deployed site, that archive replaces the Topic 2 one in the private release.

## Chapters 2 and 3 (Topics 3 and 4, 2026-11-22)

### Structure
- **One zoom ladder, three chapters.** The ladder now runs sand → polysilicon → Czochralski puller → ingot → wafers (Chapter 2) → cleanroom (Chapter 3) → wafer → die → cell → transistor → gate oxide → lattice (Chapter 1). Each layer keeps its own unit: 0.1 mm, 1 mm, 1 cm, 1 cm, 1 mm, 10 cm, then as before. `scripts/zoomcheck.mjs` scrolls from sand to the lattice and prints the scale at every stop. The scale ladder now starts at 16 m.
- **URLs.** A layer's `path` is now its full URL: `/growth/{sand,polysilicon,czochralski,ingot,wafers}`, `/clean/cleanroom`, and the unchanged `/cmos/...` paths. `?tab=` selects a tab; `?hkl=111`, `?k0=` and `?f=` deep-link the Miller and segregation tools.
- **Tabs, not new layers, for views of the same object.** Puller: Czochralski / Float zone. Lattice: Structure (Ch.1) / Unit cells / Miller planes / Bands / Defects (Ch.2). Wafer: Wafer / Process flow (Ch.2) / Gettering / Yield (Ch.3). Cleanroom: Room / Wet bench / Redox. Each tab is tagged with its chapter. The chapter menu in the top bar and the breadcrumbs follow the tab, not only the layer.
- **Content `tabs`.** A content file can list the tabs where its object appears, so the parts list and the mastery dots only show what is on screen.
- **The door opens onto the cleanroom**, which renders behind it, and the gowning loader follows slide 8: wash, gloves, suit with mask and overshoes, vinyl over latex, then the air shower. The air shower is beyond the lecture.

### Physics and the simulator
- `chapters/growth/physics.ts` and `chapters/clean/physics.ts` hold every number the scenes show. The worked solutions use the same functions. Beyond-the-lecture constants are named with their source:
  - Deal–Grove constants for 〈100〉 Si, from Plummer Table 6-2;
  - D0 and Q for B, P, As and Sb, from Plummer Table 7-5;
  - an LSS range fit for implantation, good to about ±20 %;
  - the FED-STD-209E −2.2 slope for the class lines.
- **The bands chart is qualitative.** Energies are in units of the 3s–3p separation, and the spacings b, c and d are placed for legibility. Only the regimes, the 8N/4N state counts and the opening of the gap are claimed.
- **Simulator upgrades are opt-in, so the Topic 2 recipe is untouched.** The new ops are:
  - `thermalOxide`: consumes 0.44 of the new growth from the silicon and regrows through existing oxide;
  - `develop({tone})`: positive or negative resist;
  - `etch(mat, {isotropic})`: a quarter-circle undercut, leaving a gap under the mask. This is the "void" the M2 decision deferred; the column model allows gaps without a new material;
  - `implant(..., {damage})` with `anneal()`;
  - `diffuse`: lateral reach about 0.8·xj under the oxide edge;
  - `epitaxy` and `evaporate`.
  
  They are tested in `src/sim/ops3.test.ts`. All 87 Topic 2 simulator and recipe tests still pass.
- **The process lab** runs each slide 24 flow step as a short recipe on a 2D cross-section. It uses the same `Process` class as the inverter's fab timeline. Each step links to the matching step of the Chapter 1 fab.
- **Yield.** The die grid draws defects from a gamma–Poisson mixture with shape C, which is exactly what gives the negative binomial. Neighbouring 3×3 blocks of die share a cluster factor so the failures visibly bunch up. The tests check that the counted yield matches both formulas.
- **Gettering** is drawn ×200, with the denuded zone ×3 again, and the scene says so. The scale bar reads the wafer layer's true scale.

### Learning engine
- **Three topics in one bank.** `bank.ts` loads all three fact files and every `content/topic*/questions` and `lesson` folder. Coverage of a slide includes the Topic 2 facts it links to.
- **Lessons per chapter.** Sections carry their chapter. Gating, the section menu and the "next" button work within a chapter, so Chapter 3 can be started before Chapter 1 is finished. Choosing Lesson opens the current view's chapter. Steps can link to the Chapter 1 step that already teaches an overlapping fact (`related`).
- **Generic state targets.** A `do` question can now target `{kind: 'state', layer, tab, checks: [{path, eq|min|max}]}`, read from the store. One target kind covers every Chapter 2–3 control.
- **Parameterised calculations.** A calc question can carry `answer.gen = {fn, vars}`. `learn/calcs.ts` picks values from a seed, fills in `{var}` in the prompt, and computes the answer and a full worked solution. The question card draws a new seed each time it opens, and the exam draws one per paper. Generators cover segregation, vacancies and interstitials, Si consumed by oxidation (both directions), diffusivity, the Poisson and negative-binomial yields, and Miller indices from intercepts. For Miller, the answer is the three indices typed as one number, e.g. 210, because the bank's answers are numeric.
- **Topic 2 tests kept, scoped explicitly.** The tests that count Topic 2's slides, lesson sections and old lesson length now filter to Topic 2 / Chapter 1. Their assertions are unchanged. The same lesson rules run separately for Chapters 2 and 3:
  - every fact is taught;
  - sections take 5–10 minutes;
  - at least half the checks are interactive;
  - no answer can be matched from the step's text;
  - reviews mix in earlier sections;
  - each lesson can be completed against live state.
- **Revise.** It filters by topic: all, T2, T3 or T4, plus a slide range within a topic and the areas of that topic. Coverage has a skill map (mastery per area for each chapter) above the per-slide grid of the chosen deck.

### Counts
- **Topic 3:** 142 facts (81 key), 222 questions: 142 recall, 31 do, 27 calc (8 parameterised), 16 predict, 6 label. The lesson has 10 sections, 39 steps and 48 checks, 3,109 words, about 74 minutes (sections 5.7–8.7 min).
- **Topic 4:** 96 facts (63 key), 147 questions: 96 recall, 15 do, 13 calc (2 parameterised), 13 predict, 10 label. The lesson has 7 sections, 28 steps and 33 checks, 1,883 words, about 50 minutes (sections 6.1–8.4 min).
- **Whole bank:** 696 questions. Every fact has a question, and every key fact has at least two question types (tested).

- **Slide archive for all three decks (2026-11-22).** `private/slides-all.tar.gz` (102 slides) is uploaded to the same private release, `topic2-slides`, as the asset `slides-all.tar.gz`. Its API URL is `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/778978728`. To serve Topics 3 and 4 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to it and redeploy. The old Topic 2 asset is kept, so the current deployment keeps working until then.

## Chapters 4 and 5 (Topics 5 and 6, 2026-11-23)

### Inventories
- `content/topic5/facts.json` (*Thin Film Deposition*, 53 slides): **97 facts, 79 key**. `content/topic6/facts.json` (*Epitaxy*, 31 slides): **45 facts, 36 key**. Areas: intro, deposition, cvd, safety, plasma, pvd; and epitaxy, heteroepitaxy, siepi, mbe, soi.
- **Linked, not duplicated.** Topic 5 slide 2 links to the Topic 3 oxide-thickness fact. Topic 6 slides 4 and 17 link to the Topic 3 epitaxy and evaporation facts, and slide 18 to Topic 5's vacuum table. Links may now point at any earlier topic (`facts.test.ts`).
- **No facts:** T5 slide 28 (MOCVD photographs), T5 slide 43 (repeats slide 42 word for word), T6 slide 26 (MBE photographs).

### Slide errors corrected

| Deck · slide | The slide says | The app teaches |
|---|---|---|
| T5 · 7 | TMGa and TMAl as "(CH₄)₃Ga", "(CH₄)₃Al" | Methyl groups are CH₃: (CH₃)₃Ga, (CH₃)₃Al |
| T5 · 10 | "anemia, kidney damage, death" on the argon row | Argon is inert (an asphyxiant); those effects are arsine's |
| T5 · 25 | 3SiCl₂H₂ + 4NH₃ → Si₃N₄ + 6HCl | Balanced: … + 6HCl + 6H₂ |
| T5 · 37 | "PECVD reactions" pairs the dichlorosilane nitride with 200–400 °C | That is a thermal LPCVD reaction at 700–800 °C; PECVD nitride is SiH₄ + NH₃ at 200–400 °C |
| T5 · 52 | 3SiH₄ + NH₄ → Si₃N₄ + 12H₂ | 3SiH₄ + 4NH₃ → Si₃N₄ + 12H₂ |
| T6 · 28 | SIMOX = "silicon implantation with oxide" | Separation by implantation of oxygen |

### Structure
- **Two layers inserted after the cleanroom**, with `up: 'cleanroom'`: the **deposition bay** (`/films/deposition`, Ch.4, 1 unit = 1 cm) with tabs CVD, Plasma, Evaporation, Step coverage and Si epitaxy (tagged Ch.5), and the **MBE chamber** (`/epi/mbe`, Ch.5). Scrolling into MBE reaches the **growing surface** (`/epi/surface`, 1 unit = 1 Å) with tabs Growth modes and Lattice mismatch. SOI is a new **wafer tab** (`/cmos/wafer?tab=soi`, Ch.5).
- **The ladder is now a tree.** Layers can name a parent (`up`); Esc, surfacing and the breadcrumbs follow `parentOf` / `ancestry`, trimmed to the chapter plus one layer above. The main sand-to-lattice scroll is unchanged (zoomcheck still walks the same 12 layers); the new layers are reached from the cleanroom panel, the chapter menu or their URLs.
- **One physics module.** `chapters/films/physics.ts` holds CVD kinetics, the vacuum table, MBE flux, RHEED, the lattice/bandgap data, step coverage and the autodoping profile; every scene, panel and worked solution calls it. Tested in `physics.test.ts`.

### Modelling choices (stated in the panels)
- **CVD kinetics** use the slide 18 formula exactly. k0 (10⁷ cm/s) and hG at 760 torr (3 cm/s) are illustrative, chosen so the crossover sits near 1000 °C as slide 20 draws it. hG(P) follows slide 22: DG ∝ 1/P and δS ∝ P^(−0.29), so ×~100 at 1 torr. Absolute LPCVD rates come out low (≈0.6 nm/min for poly at 620 °C with pure silane); the regimes and ratios are what is taught.
- **Vacuum** reproduces slide 40's rows (λ = 5 × 10⁻⁵ m/P, 10⁻⁶/P s per monolayer).
- **MBE flux** is slide 23's 2.64 × 10²⁰ P/√(MT), checked against P(2πmkT)^−½. One RHEED period = one monolayer = a/2 on (001).
- **Critical thickness** uses hc ≈ a/(2|f|), a rough estimate beyond the lecture, only to switch between pseudomorphic and metamorphic.
- **Step coverage** is illustrative geometry, not a feature-scale simulation. Evaporation leaves bare sidewalls, sputtering coats them thinly with overhang, CVD with low Sc is nearly conformal.
- **Autodoping** is an erfc out-diffusion plus an exponential gas-phase tail; the tail scale is illustrative. Sealing, reduced pressure and faster growth each sharpen it (tested).

### Learning
- **Eight new parameterised calculations:** Arrhenius rate ratio, CS/CG, the CVD growth rate, mean free path, monolayer time, MBE flux, growth rate from the RHEED period, and lattice mismatch.
- **Counts.** Topic 5: 155 questions (97 recall, 35 predict, 12 do, 8 calc of which 5 parameterised, 3 label); lesson of 10 sections, 39 steps. Topic 6: 78 questions (45 recall, 17 predict, 8 do, 4 calc of which 3 parameterised, 4 label); lesson of 6 sections, 21 steps. Whole bank: 553 facts, 929 questions.
- The Chapter 2–3 lesson rules now run for Chapters 4 and 5 too (`lesson.test.ts`).
- Revise filters T5 and T6; the skill map has the new areas.

### Slides
`npm run slides` renders all five decks (137 slides with Topic 2) into `private/slides/` and packs `private/slides-all.tar.gz` (28.7 MB). Both stay gitignored. The archive replaced `slides-all.tar.gz` in the private release on 2026-11-24 (clobbered, so asset 778978728 no longer exists). Its API URL is `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/786486636`. To show Topics 3–6 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to it and redeploy. The Topic 2 asset (776184764) is untouched.

## Chapters 6 and 7 (Topics 7 and 8, 2026-11-24)

### Inventories
- `content/topic7/facts.json` (*Lithography and Patterning*, 22 slides): **92 facts, 76 key**. `content/topic8/facts.json` (*Semiconductor III–V nanostructures*, 34 slides): **72 facts, 61 key**. Areas: roadmap, lightsource, exposure, optics, resist, ngl, ebeam; and nano, quantum, hetero, confinement, nanofab, dos, qdots.
- **Linked, not duplicated.** T7 slide 3 links to Topic 2's mask facts; slide 15's resist polarity and coat–expose–develop sequence link to Topics 2 and 3; slide 20's lift-off links to Topic 5's evaporation table. T8 slide 3 links to Topic 3's levels-into-bands facts; slides 11, 14, 21 and 22 link to Topic 6 (the bandgap chart, MBE layers and superlattice, the Stranski–Krastanov mode, MBE's sharp interfaces).
- **No facts:** T8 slide 34 (summary of the deck).
- **Read with care** (listed as `unreadable` in the files): T7 slide 5's "5–25 µm" label sits beside the projection printer but is the proximity gap; T7 slide 17's Socha chart values are read to ±1 nm (they agree with R = k₁λ/(n sin θ)); T7 slide 20's "Cheaper, but also slower" is unattached and read with the SEM schematic beside it; T7 slide 21's Monte Carlo extents are read to ±0.5 µm; T8 slide 33's ridge labels are small.

### Slide errors corrected

Every one is checked from first principles; `facts.test.ts` re-derives the numbers.

| Deck · slide | The slide says | The app teaches |
|---|---|---|
| T7 · 4 | The 157 nm source is "FF" | The F₂ (molecular fluorine) excimer laser |
| T7 · 7 | Φ = 1.22λf/d drawn across the whole central disk | 1.22λf/d is the radius to the first dark ring (the slide's own profile marks it from the centre); the disk is 2.44λf/d across |
| T7 · 9 | DOF = ±λ/2(NA)² = ±k₂/2(NA)² in the inline formula | DOF = ±λ/(2NA²) = ±k₂λ/NA² (the boxed form). It reproduces the worked example: KrF 248 nm, NA 0.6 → R = 0.75 × 0.248/0.6 = 0.31 µm, DOF = 0.5 × 0.248/0.36 = ±0.34 µm. The other form drops λ |
| T7 · 18 | Electrons 0.62 Å at 20 keV, ions 0.12 Å at 100 keV | Those are λ = hc/E, the photon relation, which doesn't apply to particles with mass. The de Broglie λ = h/p: 0.086 Å for 20 keV electrons (relativistic; 0.087 Å without the correction) and ≈ 9 × 10⁻⁴ Å for 100 keV protons, less for heavier ions |
| T7 · 19 | "Resolution < 1 nm" | The beam can be focused to ~1 nm; slide 22 gives the printed resolution as scattering-limited, typically 10 nm |
| T8 · 7 | k = ±nπ/L; "the bonding conditions" | Boundary conditions. −n is the same state as n (sin(−x) = −sin x), so n = 1, 2, 3… |
| T8 · 12–13 | Quantum numbers l, n (and j) = ±1, ±2, ±3… | 1, 2, 3… for the same reason |
| T8 · 12–13 | The wire and dot wavefunctions use n in every sine factor | Each direction has its own quantum number (n, l, j), matching the energy formulas |
| T8 · 30 | ρ(E) = 2σ(E − E_c) | ρ(E) = 2δ(E − E_c), the Dirac delta, as the slide's own text says |
| T8 · 28–29 | N = kL/π and ρ₁D = (1/2π)√(2m/ħ²)E^(−1/2) | N = 2kL/π and ρ₁D = (1/π)√(2m/ħ²)E^(−1/2). The slide measures the k-line from 0 to k but still applies the ½ for ± redundancy, counting each state half. Found by counting standing waves directly (`quantum.test.ts`, `facts.test.ts`) |

**Checked and correct:** the 3D and 2D DoS. Re-derived: 3D N = k³V/(3π²) → ρ = (1/2π²)(2m/ħ²)^(3/2)E^(1/2); 2D N = k²A/(2π) → ρ = m/(πħ²). The 1D prefactor is not (table above). The slide 8 plot matches Eₙ = n² × 3.76 meV for a 10 nm well with the free-electron mass. Slide 14's W_min = √(0.365 × 10) = 1.9 ≈ 2 µm. The slide 18 photon rows (3.1, 4.96, 2480 eV) are right.

### Structure
- **Chapter 6** adds two layers. The **lithography bay** (`/litho/stepper`, `up: 'cleanroom'`) has seven tabs: tool, diffraction, MTF, proximity gap, resist process, roadmap and next generation. The **e-beam writer** (`/litho/ebeam`, up the bay) has direct write, lift-off and proximity effect. The tabs draw at their own scale, so the rig's new `unitOverride` keeps the scale bar honest per tab.
- **Chapter 7** adds a ladder: the **III–V MBE chamber** (`/nano/mbe`) → **sample** (`/nano/sample`; the nanoscale entry tab and the cleaved edge) → **layers** (`/nano/layers`, with a TEM view) → **band diagram** (`/nano/bands`, with type I/II) → **wavefunctions** (`/nano/wave`: free electron, well, well → wire → dot, density of states). **Making nanostructures** (`/nano/fab`) hangs off the cleanroom with seven routes. The cleanroom panel links to all three, the Topic 3 process lab's MBE option links to the III–V chamber, and its lithography step links to the bay.
- **Camera homes per tab** are now registered with the rig (`useTabHome`), because the renderer finishes starting after a layer mounts and its `setLayer` call used to reset the view to the layer default.

### The simulator's optical exposure (Topic 7 × Topic 2)
- `expose(mask, { optics })` (`sim/ops.ts`) computes the **aerial image** (`sim/aerial.ts`): the mask is rasterised at 4 samples per λ, blurred by a separable Gaussian, and mixed between coherent (amplitude blurred, then squared) and incoherent (intensity blurred) by S. The dose is I/threshold, and develop clears where it reaches 1 (threshold 0.5). Without `optics` the step is the old ideal copy, so Chapters 1–5 and all their tests are unchanged.
- **Calibration (beyond the lecture).** A Gaussian stands in for the Airy core, with σ chosen so an isolated dark line exactly R = k₁λ/NA wide sits on the 0.5 threshold (σ = R/1.349). So "R" means what the lecture says: features wider print, narrower wash out. Tested in `optics.test.ts`.
- **The layout tie-in.** The Layout view can print the poly with any tool. The design's f gives λ = f/2 on the same λ-grid layout. "Design to the tool" searches the smallest f (10 nm steps) at which every drawn poly square prints, so f follows the tool and shrinks with λ. A fixed f with a coarse tool shows the gates washing out. The 3D cell and its fab timeline rebuild with the same optics (`printState` in `recipe.ts`), for every mask level.
- **The process lab** gains the full eight-step resist process (slide 16) as a toggle on its lithography step, so the steps play on the lab's timeline. The inverter's 45-step recipe is unchanged.

### Modelling choices (stated in the panels)
- **MTF** uses Abbe's method on an equal line/space grating: source points spread over ±S·NA, each passing the diffraction orders inside the pupil. It reproduces slide 12: larger S lowers the MTF of mid-sized features and raises it near the cut-off.
- **The Airy pattern** is [2J₁(v)/v]², and two incoherent points at the Rayleigh separation dip to 73.5 % (tested).
- **Fresnel diffraction** under a slit uses the Fresnel integrals; partial incoherence averages a small spread of angles.
- **Resist thickness** ∝ 1/√rpm, ≈ 0.5 µm at 4000 rpm (Meyerhofer). The cleared fraction ramps to 100 % at the 100 mJ cm⁻² sensitivity. Both are illustrative.
- **The e-beam proximity effect** is a single-scattering Monte Carlo (screened Rutherford plus Bethe with Joy–Luo), and ranges use Kanaya–Okayama. It shows the right trend (range grows with energy, ~10–20 % backscatter), not production accuracy.
- **Heterostructure parameters** come from Vurgaftman et al. (2001), with offsets set to the usual 60:40 (GaAs/AlGaAs, InGaAs/GaAs) and InP/InAlAs type II. Strain and band bending are ignored.
- **Wells** are solved two ways. The symmetric finite well is solved exactly by bisection on the even/odd matching equations. Any profile is solved by finite differences (Sturm-sequence bisection plus inverse iteration), and the two agree to 1 meV (tested).
- **Colloidal colour** uses the Brus model; **Stranski–Krastanov** switches at ≈ 1.7 ML (Leonard et al. 1994); **QD laser thresholds** use a characteristic-temperature model. All three are illustrative and marked "beyond the lecture".

### Learning
- **26 new parameterised calculations, each with a full worked solution.**
  - Topic 7: R, DOF, the NA needed, NA = n sin α, the Airy radius, MTF, S, W_min, the Fresnel gap limit, the roadmap's 0.7×/3 years, photon energy and the electron de Broglie wavelength.
  - Topic 8: the free-electron E(k), infinite-well levels and spacings, the e1→hh1 photon, the normalisation constant (derived step by step), wire and dot levels, the 3D, 2D and 1D DoS, and N(k) in 3D.
  - The DoS derivations are also fill-in-the-step questions (cell volume, octant factor, result).
- **Counts.**
  - Topic 7: 153 questions (92 recall, 27 predict, 17 do, 13 calc of which 11 parameterised, 4 label); lesson of 9 sections, 34 steps.
  - Topic 8: 123 questions (73 recall, 18 predict, 16 do, 10 calc all parameterised, 6 label); lesson of 8 sections, 29 steps.
  - Whole bank: 717 facts, 1205 questions.
- The Chapter 2–5 lesson rules now cover Chapters 6 and 7, and both lessons were walked end to end in the browser (`scripts/lessonrun.mjs`, which now takes a start path).
- **Revise:** the filters, coverage screen and skill map include T7 and T8. The exam sheet adds an **all-processing paper**: Topics 2–8, four questions each (two calculations where available), 40 minutes. Its title now names the topic it covers instead of always "Topic 2".


### Slides
`npm run slides` renders all seven decks (242 slides) into `private/slides/` and packs `private/slides-all.tar.gz` (36.7 MB). Both stay gitignored. On 2026-11-24 it replaced `slides-all.tar.gz` in the private release (clobbered, so asset 786486636 no longer exists). The new asset is 786861401, API URL `https://api.github.com/repos/Bumsparkle/nanoscale-atlas-slides/releases/assets/786861401`. To show Topics 3–8 on the deployed site, set Vercel's `SLIDES_ARCHIVE_URL` to it and redeploy. The Topic 2 asset (776184764) is untouched.

## Motion is always full (2026-11-24)
At the user's request the top bar's "motion full / motion reduced" button is gone, and motion is always full: the store's `reducedMotion` starts false and nothing sets it, and the `prefers-reduced-motion` CSS blocks are removed. This overrides the brief's "`prefers-reduced-motion` respected" line. The `reducedMotion` checks in the scenes stay in place (always false), so restoring the option later is a one-line change in `store.ts` plus the button.

## Drill: a missed card comes back later (2026-11-24)
A miss sends a card to Leitner box 1, due at once, and the drill puts missed cards first, so the same card used to reappear immediately. Now the drill remembers the cards shown this session. A card seen within the last three (`DRILL_GAP` in `progress.ts`, chosen by `pickNext`) waits while other due cards go first, and if fewer cards are due, cards not yet due fill the gap. It repeats sooner only when nothing else exists in the selection. A skipped card waits the same way. Tested in `progress.test.ts` and checked in the browser.

## Light theme (2026-11-24)
At the user's request a light "cleanroom" theme now ships alongside the dark one. The 2026-11-21 trial was never committed; only its comparison sheets survived (`docs/screenshots/theme/trial-dark-vs-light-*.jpg`). The new theme answers the two reasons the trial lost:
- **Backdrop contrast.** The page is a pale grey (`#e4e8ea`), never white. The environment is a mid-grey room (not a white one), so metals still show bands. Exposure is 0.86, down from 1.0. Cut faces are shaded darker (legend × 0.56 instead of 0.62, with less emissive lift), and their legend edges and hatching are darker. The legend's own greys are unchanged: they are the slide 25 colours.
- **Signals.** Additive glows don't read on a pale page, so:
  - the hover and focus outlines are painted over the image in a dark amber instead of being added as light;
  - the logic-path and mastery tints pull the part's surface colour toward the tint (same hue, darker) and keep only a little glow for the pulse;
  - layer swaps fade to the page colour, not to black;
  - glowing lines and particles (beams, carriers, UV, dust, ions) take a darker shade of the same hue.

**Tokens, not literals.** Every colour now goes through a token:
- **CSS:** `styles/tokens.css` has a `:root[data-theme='light']` block. New tokens cover what used to be literals: legend edges and hatching, grids and wires, chart series, cross-section fills, the logic bench, the home door.
- **Scenes:** `theme/scene.ts` holds the scene palette, 334 named tokens grouped by meaning (stage, env, light, signal, mastery, legend, phys, obj, atom, …). Dark is the reference; light overrides only the stage, lights, environment, exposure, outlines and signal colours.
- **Live switching:** `P` always holds the current theme's values. LayerStack keys the active layer by theme, so a switch rebuilds its materials, lights and textures. The material cache clears, and the environment map is cached per theme.

**Material meaning is fixed.** The phys, legend, obj, atom and hetero groups are identical in both themes: n+ sky blue, p+ copper, oxide pale glass, poly brown, aluminium metal, p-substrate cool grey vs n-well steel blue.

**Tests:**
- `contrast.test.ts` runs every text and signal check on both themes; all text is AA.
- `theme/palette.test.ts`:
  - material groups are identical across themes;
  - each light signal colour stays within 25° of its dark hue;
  - n-well and p-substrate differ in both themes;
  - no module-level constant captures a theme-dependent token (it would keep the old theme after a switch).
- `theme/literals.test.ts` fails on any hex or rgb() literal outside the token files.

**Switching and storage:**
- **Default:** the theme follows the system (`prefers-color-scheme`) until the user picks one. The choice is stored in localStorage (`atlas.theme.v1`). Choosing the theme the system already has goes back to following the system.
- **No flash:** an inline script in `index.html` sets `data-theme`, `color-scheme` and `theme-color` before first paint. `?theme=light|dark` forces a theme for one load (screenshot scripts).
- **Mac app:** the window appearance follows the theme through `setTheme`, so the vibrancy glass is pale under light and dark under dark. This needs the new `core:window:allow-set-theme` permission. The tint behind the scene and the panel glass have light and dark values.

**Top bar controls** (revised the same day at the user's request). The theme and the mode are two floating icons at the right of the top bar, with no button chrome:
- **Theme:** a sun on the light theme, a moon on the dark one; a click switches to the other.
- **Mode:** one icon that cycles Explore → Lesson → Revise. It shows a compass, an open book or stacked cards, in amber because it marks where you are; the tooltip names the next mode.

The text System / Light / Dark switch and the three mode buttons are gone. On phones both icons sit on the brand row.

**Screenshot review fixes** (same day). Every layer and tab was reviewed in both themes at 1440 and 375 (`scripts/themeshots.mjs`, paired with `scripts/montage.mjs`, which now packs several pairs per row). What failed on light, and the fix:
- **Focus/hover outline invisible.** TSL `mix()` over the outline masks drew nothing; it is now written out as `rgb + (ink − rgb)·a`. The light outline is thicker (`k.hoverWidth`, `k.focusWidth`) and stronger, in a mid-dark amber ink (`#9a5f00`) that reads on both the dark model and the pale page.
- **Captions over the model.** The scale's scene-coloured halo became a pale smear, and the scene-tools hint (dark text on a dark model) was unreadable. On light both sit on glass: a panel behind the scale, a chip behind the hint. Dark is unchanged.
- **Translucent signal sheets** (Miller plane, exposure cones, beams, the DoS sphere, subband plates) faded on a pale page. On light their opacity is ×1.8 (`k.sheet`), and the quantum-well slab gets the same boost.
- **Light colours that sink into pale:** the exposure light (g-line to F₂), the X-ray beam and the epi reactor's lamp rods take deeper shades of the same hue on light. `LIGHT_COLOUR` became `lightColour()`, so it reads the palette when called.
- **Other fixes:**
  - the gettering bulk region is more opaque on light;
  - the DoS "outside" states are paler, so the counted states and the sphere lead;
  - the colloid dots' ZnS shell is lighter and their glow softer, so the emission colour isn't bleached.
- **Left as is:** the TEM micrograph frame and the colloid emission colour are physical greys and colours, and both still read. The wet bench and the SOI wafer are pale but keep their edges.


## Access gate, accounts and synced progress (2026-11-24)

Replaces the HTTP basic-auth password with an access code plus Supabase accounts.

- **Two gates, both checked by the middleware on every request.** The access code keeps the course material inside the cohort; the account carries progress. Either alone is not enough: a UCL student who never got the code can't see the app, and the code alone gives nobody a session. Pages without both redirect to `/gate/`; assets and the API get a 401, never the file.
- **The landing page is its own build (`vite.gate.config.ts`) under `/gate/`.** A Vite multi-page build would share chunks (React, fonts) through `/assets/`, which is gated, so the door couldn't load. A separate build puts every file it needs under `/gate/assets/`, and the middleware allow-lists that one folder with a strict pattern (no `..`, no escapes).
- **Access token format `v1.<expiry>.<HMAC>`** over the expiry and a fingerprint of the current code, signed with `ACCESS_COOKIE_SECRET`. Stateless (no table lookup per asset request), and changing the code invalidates every cookie at once, which is the "how to change the access code" story. The code is compared as SHA-256 digests in constant time.
- **Rate limit in Postgres, not memory.** Serverless instances don't share memory; 5 failures per 15 minutes per client, keyed by an HMAC of the IP so no address is stored. If the store is unreachable the endpoint fails closed (503) rather than allowing unlimited guesses. A success clears the counter.
- **Web session in a cookie (`@supabase/ssr`), verified by JWT signature against the project JWKS.** The middleware must see the session on asset requests, so localStorage wouldn't do. Verification is local (cached JWKS), not a network call per request. An expired token on a page load bounces through `/gate/`, whose client refreshes it and comes straight back.
- **UCL-only in three places:** the Before User Created hook (friendly error on every sign-up path), a trigger on `auth.users` (the admin API skips hooks; also blocks changing email to a non-UCL address) and the middleware's email check. Confirmation is on, so an address is verified before it gets a session. Exact domain only: `@cs.ucl.ac.uk` is refused, as the brief said `@ucl.ac.uk`.
- **Local-first sync, latest write wins per item.** Each card, lesson position, fact and setting is its own row with its own change time, so two devices changing different things both keep their changes. The server enforces it too (a trigger drops an older update) so a stale device can't win by pushing last. Device clocks are trusted but clamped to now + 5 minutes. Attempts are append-only with device-made UUIDs (retries are idempotent). Deletes are tombstones so a reset reaches other devices. Pulls use a server `synced_at` cursor with a 30-second overlap, since `now()` is the transaction start and commits can land out of order.
- **Settings are one row per key** (`theme`, `speed`, `last_position`, `gowned`) for the same reason. The theme is also still cached in localStorage per device, only so the inline script can paint the right theme before any JavaScript runs.
- **Fact mastery is stored, though derivable from the cards,** because the brief asks for it per user and it makes the export and any later teacher view readable without the question bank.
- **Import of old progress is offered per device and user,** not once per account: a student might have used the old site in two browsers. Nothing in the account is overwritten (a card is taken only if the account has seen it fewer times). The old keys are kept under `.imported` rather than deleted.
- **Sign out removes the local copy only once it is fully synced;** offline with unsynced changes it asks first and keeps them.
- **Mac app: 6-digit email code, not a deep link** (the user's choice): no URL scheme, and it works when the email is opened on a phone. The session and access token are in the Keychain via three Tauri commands restricted to two item names; the app's CORS origins (`tauri://localhost`, `http://tauri.localhost`) are the only cross-origin callers the API answers. Offline, the app reads the user from the Keychain directly so it opens without a network.
- **Slides: private bucket, no storage policies, 5-minute signed URLs from `/api/slides`** after both gates. Signed by the service role on the server rather than letting signed-in users sign their own, so the access code is also required. `INCLUDE_SLIDES` personal app builds are gone: no build can contain slides now, and the guard script no longer has an override.
- **Local Supabase on ports 544xx** because another local Supabase project on this Mac already uses the defaults.
- **Deploy (2026-11-24): the Vercel Supabase integration's own variable names are used.** The integration sets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` as sensitive values (they can't be read back), plus the publishable key under `NEXT_PUBLIC_…` names. Rather than duplicate them as `VITE_` variables, both Vite configs map the URL and publishable key across at build time (`server/publicEnv.ts`, public values only).
- **Server code uses `.js` import specifiers.** Vercel runs the middleware and functions as plain Node ESM, which can't resolve `./server/access`. The first deploy failed this way (500 on every request for about 10 minutes); `server/imports.test.ts` now guards it.
- **Email templates are not customised on the live project (yet).** The Supabase free tier refuses template changes while the built-in mailer is in use, so the live emails are Supabase's defaults. Those contain the link only, not the 6-digit code the Mac app asks for. Custom SMTP fixes both this and the built-in mailer's limits (see PROGRESS).

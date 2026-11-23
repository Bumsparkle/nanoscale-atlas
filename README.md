# Nanoscale Atlas

**Live site:** _(add the Vercel URL here)_

A single-page 3D atlas of ELEC0031 (Nanoscale Processing and Characterisation), in three chapters:
- **Ch.1 CMOS inverter** (Topic 2): from a 300 mm wafer down to the 5.43 Å silicon lattice.
- **Ch.2 From sand to wafer** (Topic 3): refining, Czochralski and float-zone growth, crystal structure and Miller planes, bands, defects, and the process flow with a process lab.
- **Ch.3 Keeping it clean** (Topic 4): the cleanroom, the RCA wet bench, redox, gettering and yield.

In Chapter 1, Every 3D structure inside the chip is **generated** from the six masks of slide 28 and the fabrication recipe of slides 29–45. Every panel cites its slide.

- Spec: [BRIEF.md](BRIEF.md)
- Progress and self-review: [PROGRESS.md](PROGRESS.md)
- Decisions: [DECISIONS.md](DECISIONS.md)

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: simulator, rules, content integrity, logic, junction
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ on :4173
```

Useful URLs:

| URL | What it opens |
|---|---|
| `/` | Cleanroom door (gowning, then the cleanroom) |
| `/growth/sand` … `/growth/wafers` | Chapter 2's layers (`/growth/czochralski?tab=fz`, `?k0=0.8&f=0.9`) |
| `/clean/cleanroom?tab=wetbench` | Chapter 3 (`tab=room`, `wetbench`, `redox`) |
| `/films/deposition?tab=cvd` | Chapter 4's deposition bay (`tab=plasma`, `pvd`, `coverage`; `siepi` is Chapter 5) |
| `/epi/mbe`, `/epi/surface?tab=strain` | Chapter 5: MBE chamber, growth modes and lattice mismatch |
| `/cmos/wafer?tab=process` | Process flow and lab (`tab=gettering`, `tab=yield`, `tab=soi`) |
| `/cmos/inverter/nmos/gate-oxide/lattice?tab=miller&hkl=111` | Lattice tabs: `cells`, `miller`, `bands`, `defects` |
| `/cmos/wafer` … `/cmos/inverter/nmos/gate-oxide/lattice` | The six zoom layers |
| `/cmos/inverter?view=section&cut=slide27` | Locked section on the slide 27 line (`cut` can also be `ngate`, `pgate`, or `<λ>&axis=x\|y`) |
| `/cmos/inverter?view=fab&step=23` | Fab timeline at a given step |
| `/cmos/inverter?view=logic&a=1` | Logic view, inverter path lit |
| `/cmos/inverter/pmos?vg=0.00` | pMOS with the gate low |
| `?focus=<content-id>` | Opens a panel (e.g. `focus=poly-gate`) |
| `/debug` | Renderer backend and fps; add `?gl=webgl` to force the WebGL 2 fallback |
| `/style` | Type and colour system |

Modes (top bar):
- **Explore** is the sandbox. Its "mastery" toggle tints the model by how well you know each part.
- **Lesson** (`?mode=lesson&at=<step id>`): one lesson per chapter (Topic 2 in 15 sections, Topic 3 in 10, Topic 4 in 7, Topic 5 in 10, Topic 6 in 6). Every step explains why, drives the model and then checks you (two tries, with a hint that highlights the model). Each section ends with a mixed review.
- **Revise** (`?mode=revise`, `&rv=coverage` or `&rv=exam`) offers spaced repetition over 929 questions (filter by topic), a skill map and per-slide coverage, and a timed paper.

Each topic has `content/topicN/facts.json` (the fact inventory), `content/topicN/questions/` and `content/topicN/lesson/`. Topics 3–6 use the shared builders in `content/kit.ts`. Parameterised calculations are generated in `src/learn/calcs.ts`. The build tests fail if any fact has no question, or if a key fact lacks two question types.

Keys:
- **Global:** `Esc` goes up a level (it closes a panel first).
- **Cell views:** `e` `s` `m` `f` `l` switch view.
- **Section view:** `1` `2` `3` snap targets, arrows nudge the plane, `r` rotates it.
- **Fab view:** `←` `→` step, `space` play/pause.

## Architecture

```
src/
  sim/              pure TS: column-stack model, fractional process ops, Process (memoised snapshots),
                    greedy mesher + connected components, axis-aligned slicer
  chapters/
    content-schema.ts   zod schema for a panel (what / how made / what it does / slides / beyond-the-lecture)
    cmos/           masks.ts, recipe.ts, rules.ts (slide 47), device.ts, junction.ts, layers.ts, nodes.ts,
                    content/*.ts (one file per object), and the tests
  scene/            persistent R3F canvas on WebGPURenderer (WebGL 2 fallback), TSL materials, spring camera rig,
                    scale-matched dive transitions, CellModel (meshes from the simulator), FabEffects, layers/*
  ui/               panels, timeline, logic bench, overlays, scale bar, home/gowning
  state/            zustand store + URL sync
scripts/            Playwright: shots.mjs (screenshots), tour.mjs (recorded tours), fabsheet.mjs (all 45 steps),
                    fps.mjs, og.mjs
```

The scene core is imperative (`CellModel`, `rig`, `transition`, `cellRuntime`): React only mounts layers and owns the DOM UI. So moving the render loop to vanilla three would mean replacing `Stage.tsx` and the thin layer components, not the simulator or the camera.

## How to add a chapter

Chapters 2–5 show the second pattern: hand-built layers and tabs instead of masks. Add layers (or `tabs` on an existing layer) to `chapters/cmos/layers.ts`, put the physics in `chapters/<chapter>/physics.ts` with tests, write one content file per object in `chapters/<chapter>/content/` (with `tabs` if it appears on only some tabs), register the nodes in `nodes.ts`, and add the facts, questions and lesson under `content/topicN/`. "do" questions can target any store value with a `state` target.

For a chapter built from masks:

A chapter is masks + a recipe + content. No 3D modelling.

1. **Masks.** Create `src/chapters/<topic>/masks.ts`: each mask is a list of λ-grid rectangles (`Mask` in `sim/types.ts`), plus a simulation `GRID`. If the topic has its own design rules, add a `rules.ts` and test it the way `cmos/rules.test.ts` does.
2. **Recipe.** Create `recipe.ts`: an array of `Step`s, each with `slide`, `tool`, `chemistry`, a one-line `note`, an optional `beyond` (with a source), and an `op` built from `sim/ops.ts` (`oxidise`, `deposit`, `spinResist`, `expose`, `develop`, `etch`, `implant`, `strip`). Ops are pure and accept fractional progress, so the timeline animates them for free. If a new kind of step is needed (e.g. CMP, epitaxy), add an op there with a unit test.
3. **Tests first.** Assert the cross-section after each slide, as `cmos/recipe.test.ts` does (`signature(stackAt(model, x, y))`), and the surface sequence along the lecture's section line.
4. **Content.** Add one file per inspectable object in `content/` using `defineContent`:
   - cell objects use `anchors` (`{ key, x, y }` picks the mesh component containing that layout point; a key-only anchor is the fallback);
   - hand-built scenes use `node`.

   The integrity tests fail if any mesh component, at any fab step, has no content, or if any content matches nothing.
5. **Layers.** List the zoom levels in `layers.ts` (unit, distances, scale note). Reuse `CellLayer` for the generated level, and write hand-built levels with `Inspectable` / `InspectSync`.
6. **Section targets.** Add snap targets to `SNAP_TARGETS` in `state/store.ts`.
7. **Check it by eye.** Run `node scripts/shots.mjs`, `node scripts/fabsheet.mjs` and `node scripts/tour.mjs`, and look at the images.

## Deploy (web)

The repository deploys to Vercel as a static Vite SPA (`vercel.json`): build `npm run build`, output `dist/`, and a rewrite that sends every route to `/index.html` so deep links survive a refresh. `middleware.ts` puts the whole site, slides included, behind HTTP basic auth. Set these in Vercel:

- `SITE_PASSWORD`: required. Without it the site serves nothing (it fails closed).
- `SLIDES_ARCHIVE_URL` and `SLIDES_TOKEN`: where the build fetches the private slide archive (see DECISIONS.md).

## Desktop app (macOS)

A Tauri v2 wrapper in `src-tauri/` packages the same build as a Mac app. The window is native glass (vibrancy, following the system light or dark appearance), with a hidden title bar and inset traffic lights. The top strip drags the window, and the 3D scene floats on the glass. The web build is unaffected: app mode is detected at runtime, and the app build uses its own flag.

Prerequisites: the Xcode command-line tools and Rust (for example `brew install rustup && rustup default stable`, with `/opt/homebrew/opt/rustup/bin` on your `PATH`).

```bash
npm run tauri dev
```

```bash
npm run tauri build
```

`tauri dev` runs the dev server inside the app window. `tauri build` writes an unsigned app and `.dmg` to `src-tauri/target/release/bundle/` (`macos/Nanoscale Atlas.app` and `dmg/Nanoscale Atlas_0.1.0_aarch64.dmg`). Open the .dmg and drag the app to Applications.

**Lecture slides in the app.** By default the app contains **no** slide images, and the Source buttons are hidden. For a personal build that bundles the slides from your local, gitignored `private/slides/` (rendered with `npm run slides`), set `INCLUDE_SLIDES=1`:

```bash
INCLUDE_SLIDES=1 npm run tauri build
```

That .dmg contains UCL lecture material: keep it to yourself, and never commit it or attach it to a release. A default build (`npm run tauri build`) removes any slides left in `dist/` from an earlier build.

There is no password in the app: the Vercel middleware is web-only.

**Debug readout.** Press ⌥D for `/debug`. It shows the active renderer (WebGPU, or the WebGL 2 fallback), whether it is running as the app or in a browser, and whether slides are bundled.

**Download.** The cleanroom home page has a "Download for Mac" link (hidden inside the app). It always points to `releases/latest/download/Nanoscale-Atlas-macOS.dmg`, the newest release.

**Updates.** On launch the app checks `latest.json` on the latest GitHub Release, using the Tauri updater plugin. If a newer version exists it offers "Update and restart". Each update bundle is signed with the updater key, and the app refuses anything the public key in `src-tauri/tauri.conf.json` does not verify.

### Releases

Releases are built by GitHub Actions (`.github/workflows/release-macos.yml`) whenever a `v*` tag is pushed. The workflow:

1. checks the tag matches the app version;
2. refuses to run if any slide or PDF is tracked;
3. builds a universal (Apple Silicon and Intel) app with `INCLUDE_SLIDES` off;
4. fails if any slide image or PDF ended up in the .app, the .dmg or the updater bundle (`scripts/check-app-slides.mjs`);
5. publishes a GitHub Release with the .dmg, the signed updater bundle, `latest.json`, and notes listing the commits since the previous tag.

To release:

1. Bump the version in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` (all three must match).
2. Commit, then tag and push:

```bash
git commit -am "Release v0.3.0"
```

```bash
git tag v0.3.0
```

```bash
git push origin main v0.3.0
```

The build takes about 10–15 minutes. Watch it under Actions. The app's "Update and restart" then picks the new version up.

**Updater signing key (one-time setup, already done).** The keypair was made with `npx tauri signer generate -w ~/.tauri/nanoscale-atlas.key`. The private key and its password stay on your Mac in `~/.tauri/`, which is outside the repository, and are never committed. They are also stored as GitHub Actions secrets `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`:

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/nanoscale-atlas.key
```

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD < ~/.tauri/nanoscale-atlas.key.password
```

Keep a backup of `~/.tauri/`. If the private key is lost, installed apps can't verify any new update: you would need a new keypair, a new public key in `tauri.conf.json`, and everyone would have to download the .dmg once by hand.

**Local builds** don't need the key. `npm run tauri build` (and your personal `INCLUDE_SLIDES=1 npm run tauri build`) skip the updater artifacts, which only the release workflow switches on. A personal build with slides must never be uploaded to a release.

**Signing and notarising (later).** The .dmg is ad-hoc signed only. A Mac that downloads it will refuse to open it until you right-click it and choose Open. To distribute it properly with an Apple Developer account:

1. Create a "Developer ID Application" certificate in your Apple Developer account and install it in your keychain.
2. Set `bundle.macOS.signingIdentity` in `src-tauri/tauri.conf.json` to that identity, for example `"Developer ID Application: Your Name (TEAMID)"`, or export `APPLE_SIGNING_IDENTITY`.
3. For notarisation, export `APPLE_ID`, `APPLE_PASSWORD` (an app-specific password) and `APPLE_TEAM_ID`, or an App Store Connect API key (`APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH`).
4. Run `npm run tauri build`. Tauri signs the app and submits it to Apple's notary service, and the resulting .dmg opens without warnings.

None of this is set up yet, and no credentials are in the repository.

## Facts and sources

The lecture PDFs are UCL course material and are **not** included in this repository. To work on the content, put your own copies at `docs/topic2-cmos.pdf`, `docs/topic3-silicon-growth.pdf` and `docs/topic4-cleaning-cleanrooms.pdf` (all gitignored), then `npm run slides`.

On-slide facts cite the Topic 2 slide numbers (PDF page = slide). Anything beyond the lecture is marked "beyond the lecture" with a named source. The main ones are:
- Plummer, Deal & Griffin, *Silicon VLSI Technology*
- Weste & Harris, *CMOS VLSI Design*
- Sze & Ng, *Physics of Semiconductor Devices*
- Kittel, *Introduction to Solid State Physics*
- SEMI M1

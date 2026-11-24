# Nanoscale Atlas

**Live site:** https://nanoscale-atlas.vercel.app (access code and a UCL account required)

A single-page 3D atlas of ELEC0031 (Nanoscale Processing and Characterisation). The processing (“Make”) half is complete, in seven chapters:
- **Ch.1 CMOS inverter** (Topic 2): from a 300 mm wafer down to the 5.43 Å silicon lattice.
- **Ch.2 From sand to wafer** (Topic 3): refining, Czochralski and float-zone growth, crystal structure and Miller planes, bands, defects, and the process flow with a process lab.
- **Ch.3 Keeping it clean** (Topic 4): the cleanroom, the RCA wet bench, redox, gettering and yield.
- **Ch.4 Laying down films** (Topic 5): CVD kinetics, plasma, evaporation and sputtering, step coverage.
- **Ch.5 Atom by atom** (Topic 6): epitaxy, lattice mismatch, Si epi, MBE with RHEED, SOI.
- **Ch.6 Printing smaller** (Topic 7): light sources, exposure tools, diffraction, resolution and depth of focus, MTF, proximity printing, resists, the roadmap, next-generation and e-beam lithography; the inverter printed by a real tool.
- **Ch.7 Quantum structures** (Topic 8): III–V heterostructures grown by MBE, the nanoscale, quantum wells, type I/II alignment, wires and dots, the density of states, nanofabrication routes and the QD laser.

In Chapter 1, Every 3D structure inside the chip is **generated** from the six masks of slide 28 and the fabrication recipe of slides 29–45. Every panel cites its slide.

- Spec: [BRIEF.md](BRIEF.md)
- Progress and self-review: [PROGRESS.md](PROGRESS.md)
- Decisions: [DECISIONS.md](DECISIONS.md)

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: simulator, rules, content integrity, logic, junction, gate, sync
npm run test:db    # RLS, UCL-only sign-up, rate limit, sync: needs `npx supabase start`
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
- **Lesson** (`?mode=lesson&at=<step id>`): one lesson per chapter (Topic 2 in 15 sections, Topic 3 in 10, Topic 4 in 7, Topic 5 in 10, Topic 6 in 6, Topic 7 in 9, Topic 8 in 8). Every step explains why, drives the model and then checks you (two tries, with a hint that highlights the model). Each section ends with a mixed review.
- **Revise** (`?mode=revise`, `&rv=coverage` or `&rv=exam`) offers spaced repetition over 1205 questions (filter by topic), a skill map and per-slide coverage, and timed papers: one for the current filter (20 min) and one for the whole processing half, Topics 2–8 (40 min, four questions per topic).

Each topic has `content/topicN/facts.json` (the fact inventory), `content/topicN/questions/` and `content/topicN/lesson/`. Topics 3–8 use the shared builders in `content/kit.ts`. Parameterised calculations are generated in `src/learn/calcs.ts`. The build tests fail if any fact has no question, or if a key fact lacks two question types.

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

## Heterostructure model (Chapter 7, reused by the Measure half)

`src/chapters/nano/hetero.ts` describes a III–V sample once; every Chapter 7 view derives from it.

- **`Material`**: `id`, `name`, band gap `Eg` (eV, 300 K), valence-band offset `VBO` (eV on one absolute scale, so `Ec = VBO + Eg`, `Ev = VBO`), electron and heavy-hole masses `me`, `mh` (m₀), lattice constant `a` (Å), display colour. Values after Vurgaftman, Meyer & Ram-Mohan (2001); alloys are listed directly.
- **`Layer`**: `mat` (a material id), thickness `nm`, `role` (`substrate`, `buffer`, `barrier`, `well`, `cladding`, `cap`, `dots`, `spacer`), and optional `doping` (cm⁻³, positive n, negative p) for the 2DEG and HEMT.
- **`Heterostructure`**: `id`, `name`, `layers` from the substrate up, and the `slide` it illustrates. `SAMPLES` holds the GaAs/AlGaAs well, InGaAs/GaAs multiple wells, InP/InAlAs (type II) and the slide 33 QD laser.
- **Derived**: `spans` (each layer's z₀–z₁), `bandProfile(h, dz)` (Ec, Ev, me, mh sampled every dz nm), `alignment(well, barrier)` (type I/II/III, which layer holds the electron and the hole, ΔEc, ΔEv), `mismatch`, and `confinedLevels(h, 'e' | 'h')`, which solves the actual profile with `solveProfile` in `quantum.ts` (finite differences with BenDaniel–Duke mass matching) for absolute level energies and normalised wavefunctions.
- **To extend it** for a HEMT: add a doped AlGaAs layer (`doping`) and a band-bending (Poisson) step that adds an electrostatic potential to `bandProfile`; the solver, band view and levels already take any profile.

## How to add a chapter

Chapters 2–7 show the second pattern: hand-built layers and tabs instead of masks. Add layers (or `tabs` on an existing layer) to `chapters/cmos/layers.ts`, put the physics in `chapters/<chapter>/physics.ts` with tests, write one content file per object in `chapters/<chapter>/content/` (with `tabs` if it appears on only some tabs), register the nodes in `nodes.ts`, and add the facts, questions and lesson under `content/topicN/`. "do" questions can target any store value with a `state` target.

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

## Access, accounts and progress

Two gates stand in front of everything (`middleware.ts`, Vercel Routing Middleware, runs on every request):

1. **The access code.** `/gate/` is the landing page: the cleanroom door with an access-code field. `POST /api/access` compares a SHA-256 of the code against `SITE_ACCESS_CODE` in constant time, allows 5 wrong tries per client per 15 minutes (counted in Postgres against a keyed hash of the IP, never the IP), and on success sets `atlas_access`, an httpOnly, Secure, SameSite=Lax cookie signed with `ACCESS_COOKIE_SECRET` (30 days). The code is never logged, returned or put in the bundle.
2. **A Supabase Auth session** for a verified `@ucl.ac.uk` address: magic link, 6-digit email code, or password. The web session lives in the `atlas-auth` cookie so the middleware can verify its JWT (against the project's JWKS) on every request.

Only `/gate/*` (the landing page, its own assets under `/gate/assets/`, and `/gate/privacy`), `/api/access`, `/favicon.svg`, `/og.png` and `/robots.txt` are public. Every other page, asset and API call needs both; pages without them redirect to `/gate/?next=…`, everything else gets a 401. Without the env vars the site serves nothing (503).

**Progress** is local-first (`src/sync/`): every change is written to this device's store at once (works offline, including in the Mac app) and synced to Postgres in the background: a moment after each change, on reconnect, on focus, and every minute. Each item (a Revise card, a lesson step, a fact's mastery, a setting) carries its change time and the latest write wins, item by item; a Postgres trigger refuses an older write too. Question attempts are an append-only log with ids made on the device, so a retried push never duplicates one. On the first sign-in on a device that has progress from before accounts, the app offers to import it.

**Account menu** (person icon, top right): sync state, a progress summary, *Export my data* (one JSON file of every row plus this device's copy), *Privacy*, *Sign out*, and *Delete my account* (deletes the auth user; every row goes with it by `on delete cascade`).

**Lecture slides** are in the private Storage bucket `slides`, with no storage policies: nobody can list or read it directly. `POST /api/slides` (both gates) returns signed URLs that expire after 5 minutes. No slide is in git, any build, or a release.

### Supabase setup

Schema, RLS and the sign-up restriction are migrations in `supabase/migrations/`:

| Table | Holds | RLS |
|---|---|---|
| `profiles` | email, the import choice | read own; update only `local_import*` |
| `lesson_progress` | per lesson position: `done`, `peeked` | own rows only |
| `revise_cards` | Leitner box, due, seen, right | own rows only |
| `fact_mastery` | per fact: score, mastered | own rows only |
| `user_settings` | `theme`, `speed`, `last_position`, `gowned` | own rows only |
| `question_attempts` | every first attempt (append-only) | insert and read own; no update or delete |
| `private.access_failures` | access-code rate limit | not exposed; service role only |

The four latest-write-wins tables carry `updated_at` (device clock, clamped to now + 5 min), `synced_at` (server, the pull cursor) and `deleted` (tombstones). `anon` has no grants at all.

**UCL only, enforced server-side:** `public.hook_ucl_only` is a *Before User Created* Auth hook (every sign-up path), the `ucl_only_users` trigger on `auth.users` also refuses non-UCL addresses on insert (covering the admin API) and on any email change, and email confirmation is on, so an address only gets a session after using the link or code sent to it. The middleware also rejects any JWT whose email is not `@ucl.ac.uk`.

Hosted project, once:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push            # applies the migrations, creates the private slides bucket
npx supabase config push        # auth settings, email templates, the hook (from supabase/config.jsonc)
```

Then in the dashboard check: **Authentication → Hooks**: *Before User Created* → Postgres function `public.hook_ucl_only`; **Authentication → Sign In / Providers → Email**: confirm email on; **URL Configuration**: Site URL = the deployed site, redirect URLs include `https://<site>/gate/**`; **SMTP**: set a real sender (Supabase's built-in mailer is limited to a few emails an hour). Upload the slides from your local `private/slides/`:

```bash
ENV_FILE=.env.production.local npm run slides:upload
```

**The live project** is `supabase-coral-lamp` (`fsrhpubygmipnenlgsbq`), created by Vercel's Supabase integration, which also sets `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` and the publishable key on Vercel. The builds copy the URL and publishable key to the `VITE_` names themselves (`server/publicEnv.ts`), so only `SITE_ACCESS_CODE` and `ACCESS_COOKIE_SECRET` were added by hand. Those integration values are marked sensitive and can't be pulled back with `vercel env pull`, so CLI work goes through `npx supabase login` instead. When pushing auth config, push a copy of `supabase/config.jsonc` with the production `site_url` and redirect URLs, never the localhost ones.

### Environment variables

| Name | Where | What |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Vercel, app build | the project URL and publishable key (public) |
| `SUPABASE_URL` | Vercel | the same URL, for the server |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | rate limit, signed slide URLs, account deletion. Never `VITE_`-prefixed |
| `SITE_ACCESS_CODE` | Vercel only | the access code |
| `ACCESS_COOKIE_SECRET` | Vercel only | 32+ random characters (`openssl rand -base64 48`) |
| `SUPABASE_JWT_SECRET` | Vercel, optional | only for a project still on the legacy shared JWT secret |
| `VITE_SITE_URL` | app build | the deployed site, where the Mac app calls `/api/*` |

For the release workflow, set repository **variables** (not secrets; they ship in the app): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SITE_URL`.

**Changing the access code:** set a new `SITE_ACCESS_CODE` in Vercel and redeploy. Every access cookie and app token carries a fingerprint of the code it was issued for, so all of them stop working at once and everyone types the new code (their accounts and progress are untouched). Rotating `ACCESS_COOKIE_SECRET` does the same.

### Local development

```bash
npx supabase start              # local stack on ports 544xx (Docker)
cp .env.example .env.local      # fill in the keys `supabase start` prints, a code and a secret
npm run slides:upload           # optional: slides into the local bucket
npm run dev
```

`npm run dev` runs the real middleware and API inside Vite (`server/devPlugin.ts`), gating pages and the API. Sign-in emails land in Mailpit at http://127.0.0.1:54424. `npm run preview` serves the production build with every request gated, exactly as on Vercel.

### Tests

- `npm test`: unit tests, including the middleware (public paths, both gates, forged/expired/old-code tokens, non-UCL and anonymous JWTs, path tricks), `/api/access` (wrong code rejected, rate limit and its expiry, the code never in a response or log, fail closed), the sync engine (offline then online, two devices, latest write wins, append-only retries, tombstones) and the localStorage import.
- `npm run test:db` (needs `npx supabase start`): RLS denies every cross-user read and write, anon gets nothing, attempts are append-only, the bucket is private, account deletion cascades, non-UCL sign-up is refused on every path, the rate limit holds across instances, and sync and import run end to end against Postgres.

## Deploy (web)

Vercel builds `npm run build` (the app, then the landing page into `dist/gate/`) and serves `dist/`. `vercel.json` rewrites deep links to `/index.html` but never `/api/`, `/gate/` or `/assets/`; gated assets are `Cache-Control: private`.

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

**Sign-in in the app.** The app shows the same door in its window: the access code (checked by `/api/access` on the deployed site, which hands back a token instead of a cookie) and then a 6-digit email code or a password. The access token and the Supabase session are kept in the macOS Keychain (`src-tauri/src/lib.rs`, items `session` and `access` under `app.nanoscaleatlas.desktop`), never in the webview's storage. Progress syncs with the website through the same account; offline, the app opens with the last session and its local copy, and syncs when back online. The app contains no slide images: the Source modal fetches signed URLs like the website.

**Debug readout.** Press ⌥D for `/debug`. It shows the active renderer (WebGPU, or the WebGL 2 fallback) and whether it is running as the app or in a browser.

**Download.** The cleanroom home page has a "Download for Mac" link (hidden inside the app). It always points to `releases/latest/download/Nanoscale-Atlas-macOS.dmg`, the newest release.

**Updates.** On launch the app checks `latest.json` on the latest GitHub Release, using the Tauri updater plugin. If a newer version exists it offers "Update and restart". Each update bundle is signed with the updater key, and the app refuses anything the public key in `src-tauri/tauri.conf.json` does not verify.

### Releases

Releases are built by GitHub Actions (`.github/workflows/release-macos.yml`) whenever a `v*` tag is pushed. The workflow:

1. checks the tag matches the app version;
2. refuses to run if any slide or PDF is tracked;
3. builds a universal (Apple Silicon and Intel) app pointed at the Supabase project and site in the repository variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SITE_URL`;
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

**Local builds** don't need the key. `npm run tauri build` skips the updater artifacts, which only the release workflow switches on.

**Signing and notarising (later).** The .dmg is ad-hoc signed only. A Mac that downloads it will refuse to open it until you right-click it and choose Open. To distribute it properly with an Apple Developer account:

1. Create a "Developer ID Application" certificate in your Apple Developer account and install it in your keychain.
2. Set `bundle.macOS.signingIdentity` in `src-tauri/tauri.conf.json` to that identity, for example `"Developer ID Application: Your Name (TEAMID)"`, or export `APPLE_SIGNING_IDENTITY`.
3. For notarisation, export `APPLE_ID`, `APPLE_PASSWORD` (an app-specific password) and `APPLE_TEAM_ID`, or an App Store Connect API key (`APPLE_API_ISSUER`, `APPLE_API_KEY`, `APPLE_API_KEY_PATH`).
4. Run `npm run tauri build`. Tauri signs the app and submits it to Apple's notary service, and the resulting .dmg opens without warnings.

None of this is set up yet, and no credentials are in the repository.

## Facts and sources

The lecture PDFs are UCL course material and are **not** included in this repository. To work on the content, put your own copies at `docs/topic2-cmos.pdf`, `docs/topic3-silicon-growth.pdf`, `docs/topic4-cleaning-cleanrooms.pdf`, `docs/topic5-thin-films.pdf`, `docs/topic6-epitaxy.pdf`, `docs/topic7-lithography.pdf` and `docs/topic8-iii-v-nanostructures.pdf` (all gitignored), then `npm run slides`.

On-slide facts cite the Topic 2 slide numbers (PDF page = slide). Anything beyond the lecture is marked "beyond the lecture" with a named source. The main ones are:
- Plummer, Deal & Griffin, *Silicon VLSI Technology*
- Weste & Harris, *CMOS VLSI Design*
- Sze & Ng, *Physics of Semiconductor Devices*
- Kittel, *Introduction to Solid State Physics*
- SEMI M1

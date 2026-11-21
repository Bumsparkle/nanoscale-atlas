# Nanoscale Atlas

**Live site:** _(add the Vercel URL here)_

A single-page 3D atlas of ELEC0031 (Nanoscale Processing and Characterisation). Chapter 1 is the CMOS inverter from Topic 2, followed from a 300 mm wafer down to the 5.43 Å silicon lattice. Every 3D structure inside the chip is **generated** from the six masks of slide 28 and the fabrication recipe of slides 29–45. Every panel cites its slide.

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
| `/` | Cleanroom door |
| `/cmos/wafer` … `/cmos/inverter/nmos/gate-oxide/lattice` | The six zoom layers |
| `/cmos/inverter?view=section&cut=slide27` | Locked section on the slide 27 line (`cut` can also be `ngate`, `pgate`, or `<λ>&axis=x\|y`) |
| `/cmos/inverter?view=fab&step=23` | Fab timeline at a given step |
| `/cmos/inverter?view=logic&a=1` | Logic view, inverter path lit |
| `/cmos/inverter/pmos?vg=0.00` | pMOS with the gate low |
| `?focus=<content-id>` | Opens a panel (e.g. `focus=poly-gate`) |
| `/debug` | Renderer backend and fps; add `?gl=webgl` to force the WebGL 2 fallback |
| `/style` | Type and colour system |

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

## Deploy

The repository deploys to Vercel as a static Vite SPA (`vercel.json`): build `npm run build`, output `dist/`, and a rewrite that sends every route to `/index.html` so deep links survive a refresh. Import the GitHub repo in Vercel; no environment variables are needed.

## Facts and sources

The lecture PDF is UCL course material and is **not** included in this repository. To work on the content, put your own copy at `docs/topic2-cmos.pdf` (gitignored).

On-slide facts cite the Topic 2 slide numbers (PDF page = slide). Anything beyond the lecture is marked "beyond the lecture" with a named source. The main ones are:
- Plummer, Deal & Griffin, *Silicon VLSI Technology*
- Weste & Harris, *CMOS VLSI Design*
- Sze & Ng, *Physics of Semiconductor Devices*
- Kittel, *Introduction to Solid State Physics*
- SEMI M1

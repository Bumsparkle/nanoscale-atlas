import * as THREE from 'three/webgpu'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { inverterProcess } from '../../chapters/cmos/recipe'
import { layoutState } from '../../chapters/cmos/layout'
import { MESH_OPTS } from '../../chapters/cmos/display'
import { resolveComponents, CONTENT_BY_ID, CONTENT } from '../../chapters/cmos/content'
import { chunkForObject, objectMastery } from '../../learn/progress'
import { mesh } from '../../sim/mesher'
import { SNAP_TARGETS, useAtlas, type CutAxis } from '../../state/store'
import { CellModel, TIER_NAMES, TIER_SPACING, type CellView } from '../CellModel'
import { gridMaterial, matUniforms, type Lit } from '../materials'
import { StudioLights } from '../Lighting'
import { selection } from '../Pipeline'
import { rig } from '../rig'
import { transition } from '../transition'
import { cellRuntime as rt, overlay, TIERS, type ScreenLabel } from '../cellRuntime'
import { Spring, SPRINGS, clamp } from '../spring'
import { cutLabels, PLANE_RANGE, snapFor, type CutLabel } from '../section'
import { CELL_CENTRE } from '../cellGeometry'
import { layoutFrame, ORTHO_FOV, LEARN_PANEL_W } from '../../ui/layoutFrame'
import { sound } from '../../ui/sound'
import { FabEffects } from '../FabEffects'

/**
 * Inverter conducting path for input A (slides 16–17): A = 1 turns the
 * nMOS on and connects Y to GND; A = 0 turns the pMOS on and connects Y to
 * VDD. The poly (input A) glows amber when A = 1.
 */
function masteryLit(): Map<string, Lit> {
  const m = new Map<string, Lit>()
  for (const c of CONTENT) {
    if (c.layer !== 'cell') continue
    const o = objectMastery(c.id)
    if (o) m.set(c.id, ('m-' + o.level) as Lit)
  }
  return m
}

function logicLit(a: 0 | 1): Map<string, Lit> {
  const m = new Map<string, Lit>()
  const path = a ? ['metal-gnd', 'nmos-source', 'nmos-drain', 'metal-y', 'contact'] : ['metal-vdd', 'pmos-source', 'pmos-drain', 'metal-y', 'contact']
  for (const id of path) m.set(id, 'on')
  if (a) m.set('poly-gate', 'hi')
  return m
}

/** objects that sit under the field oxide and the metal */
const BURIED = new Set(['substrate', 'nwell', 'nmos-source', 'nmos-drain', 'pmos-source', 'pmos-drain', 'substrate-tap', 'well-tap', 'poly-gate', 'gate-oxide', 'contact'])

const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const ray = new THREE.Raycaster()

/** pointer → layout coordinates (λ) on the silicon surface plane */
function pointerToLayout(e: { clientX: number; clientY: number }, camera: THREE.Camera, el: HTMLElement): [number, number] | null {
  const r = el.getBoundingClientRect()
  const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  ray.setFromCamera(ndc, camera)
  const p = ray.ray.intersectPlane(ground, new THREE.Vector3())
  if (!p) return null
  return [p.x + CELL_CENTRE.x, CELL_CENTRE.y - p.z]
}

type DragMode = 'section' | 'masks'
let beginDrag: ((mode: DragMode, e: PointerEvent) => void) | null = null

/**
 * Layer 3: the inverter cell, generated from the six masks and the recipe.
 * Views: explore (inspect), section (locking cut plane), masks (explode),
 * fab (timeline), logic (switch-level).
 */
export default function CellLayer() {
  // always the process for the current (possibly edited) layout
  const process = useMemo(() => ({
    get length() { return inverterProcess().length },
    at: (s: number) => inverterProcess().at(s),
    final: () => inverterProcess().final(),
  }), [])
  /** layout version the geometry was built from: frozen while editing in the Layout view */
  const builtVer = useRef(layoutState.version())
  const model = useMemo(() => new CellModel(), [])
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const gl = useThree((s) => s.gl)
  const grid = useMemo(() => gridMaterial(), [])
  const geoKey = useRef('')
  const xray = useRef(new Spring(0, SPRINGS.ui))
  const labelCache = useRef<{ key: string; labels: CutLabel[] }>({ key: '', labels: [] })
  const tierSettled = useRef<boolean[]>(Array(TIERS).fill(true))
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const refreshSelection = () => {
    const st = useAtlas.getState()
    const hov = st.hover && st.hover !== st.focus ? model.meshesFor(st.hover) : []
    selection.set('hover', st.hint ? [...hov, ...model.meshesFor(st.hint)] : hov)
    selection.set('focus', model.meshesFor(st.focus))
  }

  const project = (p: [number, number, number]) => {
    tmp.set(p[0], p[1], p[2]).project(camera)
    return { x: ((tmp.x + 1) / 2) * size.width, y: ((1 - tmp.y) / 2) * size.height, visible: tmp.z < 1 }
  }

  const publishLabels = (view: string, axis: CutAxis, locked: string | null) => {
    const out: ScreenLabel[] = []
    if (view === 'section' && locked && rt.gap > 0.55) {
      const off = SNAP_TARGETS[locked as keyof typeof SNAP_TARGETS].offset
      const k = `${axis}${off}|${builtVer.current}`
      if (labelCache.current.key !== k) labelCache.current = { key: k, labels: cutLabels(process.final(), axis, off) }
      for (const l of labelCache.current.labels) {
        const s = project(l.p)
        out.push({ id: l.id, text: l.text, sub: l.sub, x: s.x, y: s.y, group: l.group, visible: s.visible })
      }
    } else if (view === 'masks') {
      const ex = rt.explode
      if (Math.max(...ex) > 0.3) {
        for (let i = 0; i < TIERS; i++) {
          const y = i * ex[i] * TIER_SPACING + (i === 0 ? -2 : 0.6)
          const s = project([-32.5, y, -10])
          out.push({ id: 'tier' + i, text: TIER_NAMES[i], x: s.x, y: s.y, group: 'side', visible: ex[i] > 0.3 && s.visible })
        }
      }
    }
    const sig = out.map((l) => l.id).join(',')
    if (sig !== overlay.labels.map((l) => l.id).join(',')) overlay.version++
    overlay.labels = out
  }

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const reduced = st.reducedMotion

    // fab timeline: playback eases through each step and dwells briefly on it
    if (st.view === 'fab') {
      if (st.playing) {
        const SEG = 1.75
        const MOVE = 1.3
        rt.play.t += dt
        const seg = Math.floor(rt.play.t / SEG)
        const local = rt.play.t - seg * SEG
        const e = Math.min(1, local / MOVE)
        const eased = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2
        const target = rt.play.from + seg + eased
        if (target >= process.length - 1) {
          rt.fab.target = process.length - 1
          st.set({ playing: false, step: process.length - 1 })
        } else rt.fab.target = target
      }
      rt.fab.step(dt, reduced)
      const k = Math.round(rt.fab.value)
      if (Math.abs(rt.fab.value - k) < 0.02 && k !== st.step) st.set({ step: k })
    }

    // x-ray: fade wiring and field oxide over buried objects
    xray.current.target = st.view === 'logic' || (st.mastery && st.mode === 'explore') ? 0.6 : st.focus && BURIED.has(st.focus) ? 1 : st.hover && BURIED.has(st.hover) && st.view === 'explore' ? 0.45 : 0
    matUniforms.xray.value = xray.current.step(dt, reduced)
    matUniforms.foxFade.value = st.view === 'masks' ? Math.min(1, Math.max(...rt.explode) * 1.5) : 0
    matUniforms.nearFade.value = Math.min(1, Math.max(0, rt.gap))
    const ghostNear = rt.gap > 0.5
    const throughWiring = st.mastery && st.mode === 'explore'
    model.pickable = (m) => !(ghostNear && m.userData.half === 'near') && !(throughWiring && (m.userData.key === 'al' || m.userData.key === 'fox'))

    // section plane: damped follow, magnetic capture with overshoot, hysteresis release
    const sec = st.section
    if (st.view === 'section') {
      if (rt.dragging && rt.raw != null) {
        const snap = snapFor(sec.axis, rt.raw, sec.locked)
        if (snap) {
          rt.plane.cfg = SPRINGS.snap
          rt.plane.target = SNAP_TARGETS[snap].offset
          if (sec.locked !== snap) {
            st.setSection({ locked: snap, offset: SNAP_TARGETS[snap].offset })
            sound.click(1)
          }
        } else {
          rt.plane.cfg = SPRINGS.part
          rt.plane.target = rt.raw
          if (sec.locked) st.setSection({ locked: null })
        }
      } else if (sec.locked) {
        rt.plane.cfg = SPRINGS.snap
        rt.plane.target = SNAP_TARGETS[sec.locked].offset
      }
      rt.gapS.target = useAtlas.getState().section.locked ? 1 : 0
    } else rt.gapS.target = 0
    rt.plane.step(dt, reduced)
    rt.gapS.step(dt, reduced)

    // mask explode tiers: each returns on its own spring, with its own click
    for (let i = 0; i < TIERS; i++) {
      const t = rt.tiers[i]
      t.step(dt, reduced)
      const settled = Math.abs(t.value - t.target) < 0.02 && Math.abs(t.velocity) < 0.3
      if (settled && !tierSettled.current[i] && t.target === 0) sound.click(0.55)
      tierSettled.current[i] = settled
    }

    // rebuild geometry only when shape-defining inputs change
    const s = st.view === 'fab' ? rt.fab.value : process.length - 1
    const clip = st.view === 'section' ? { axis: sec.axis, offset: rt.sectionOffset } : null
    const gap = st.view === 'section' ? rt.gap : 0
    const explode = rt.explode
    const lit = st.view === 'logic' ? logicLit(st.inputs.a) : st.mastery && st.mode === 'explore' && st.view === 'explore' ? masteryLit() : undefined
    // edited masks rebuild the cell when you leave the Layout view, not on every drag
    const ver = st.view === 'layout' ? builtVer.current : layoutState.version()
    const key = `${s.toFixed(4)}|${clip ? clip.axis + clip.offset.toFixed(3) : '-'}|${gap > 0.001 ? 1 : 0}|${lit ? (st.view === 'logic' ? 'L' + st.inputs.a : 'M' + st.progressVersion) : ''}|v${ver}`
    if (key !== geoKey.current) {
      geoKey.current = key
      builtVer.current = ver
      const res = mesh(process.at(s), MESH_OPTS)
      const view: CellView = { clip, gap, explode, lit }
      model.update(res, resolveComponents(res), view)
      rt.res = res
      rt.model = model
      refreshSelection()
    }
    model.applyExplode(explode, gap, clip?.axis ?? null)
    publishLabels(st.view, sec.axis, sec.locked)
  })

  useEffect(() => {
    const st0 = useAtlas.getState()
    if (st0.section.locked) {
      rt.plane.snap(SNAP_TARGETS[st0.section.locked].offset)
      rt.gapS.snap(1)
    } else rt.plane.snap(st0.section.offset)
    rt.fab.snap(st0.view === 'fab' ? st0.step : process.length - 1)

    /** look at the far half's cut face, slightly oblique, like a drawing on a bench */
    const faceCut = (id: keyof typeof SNAP_TARGETS) => {
      const t = SNAP_TARGETS[id]
      if (t.axis === 'y') {
        rig.target.setTarget([0, -2.2, -(t.offset - CELL_CENTRE.y)])
        rig.azimuth.target = -0.3
        rig.polar.target = 1.08
        rig.dist.target = 100
      } else {
        rig.target.setTarget([t.offset - CELL_CENTRE.x, -2.2, 0])
        rig.azimuth.target = -Math.PI / 2 + 0.32
        rig.polar.target = 1.08
        rig.dist.target = 64
      }
    }
    /** straight down, near-orthographic, framed to match the SVG drawing */
    const layoutCamera = () => {
      const f = layoutFrame(size.width, size.height, useAtlas.getState().mode !== 'explore' ? LEARN_PANEL_W + 16 : 0)
      const Hworld = size.height / f.s
      rig.locked = true
      rig.fov.target = ORTHO_FOV
      rig.target.setTarget([0, 0, -(size.height / 2 - f.cy) / f.s])
      rig.polar.target = 0.0008
      rig.azimuth.target = 0
      rig.dist.target = Hworld / (2 * Math.tan((ORTHO_FOV * Math.PI) / 360)) / rig.aspectBoost
    }
    const masksCamera = () => {
      rig.target.setTarget([0, 6, 0])
      rig.polar.target = 1.2
      rig.azimuth.target = -0.55
      rig.dist.target = 158
    }
    const focusOn = (id: string) => {
      const b = model.boundsFor(id)
      if (b) rig.focusBox(b, camera.fov, size.width / size.height, { padding: 1.6, minDist: 30 })
    }
    const unsub = useAtlas.subscribe((s, p) => {
      if (s.hover !== p.hover || s.focus !== p.focus || s.hint !== p.hint) refreshSelection()
      if (s.look !== p.look && s.look && CONTENT_BY_ID[s.look]?.layer === 'cell') focusOn(s.look)
      if (s.focus !== p.focus) {
        // while answering "find it on the model", clicks select without flying the camera
        if (s.quiz || p.quiz) {
          /* keep the question's framing */
        } else if (s.focus && CONTENT_BY_ID[s.focus]?.layer === 'cell') focusOn(s.focus)
        else if (!s.focus && p.focus && s.view !== 'layout') rig.goHome()
      }
      if (s.section.locked !== p.section.locked || (s.view === 'section' && p.view !== 'section' && s.section.locked)) {
        if (s.view === 'section' && s.section.locked) faceCut(s.section.locked)
        else if (!s.section.locked && p.section.locked && !rt.dragging) rig.goHome()
      }
      if (s.view !== p.view) {
        if (s.view === 'layout') layoutCamera()
        else if (p.view === 'layout') {
          rig.locked = false
          rig.fov.target = 32
          rig.goHome()
        }
        if (s.view === 'logic') {
          rig.target.setTarget([-3, -2, 0])
          rig.polar.target = 0.62
          rig.dist.target = 120
        }
        if (s.view === 'masks') masksCamera()
        else if (p.view === 'masks' || p.view === 'section') rig.goHome()
        if (p.view === 'masks') for (const t of rt.tiers) t.target = 0
        if (s.view === 'fab') {
          rt.fab.snap(s.step)
          rig.setHome({ target: [0, -0.5, 0] })
          rig.goHome()
        } else if (p.view === 'fab') {
          rt.fab.snap(process.length - 1)
          rig.setHome({ target: [0, -2, 0] })
        }
      }
    })
    // test hook: screen position of an object's visible centre (scripted clicks in screenshot runs)
    ;(window as unknown as { __objectPoint: unknown }).__objectPoint = (id: string) => {
      const ms = model.meshesFor(id).filter((m) => m.userData.half !== 'near')
      if (!ms.length) return null
      const box = new THREE.Box3()
      for (const m of ms) box.expandByObject(m)
      const c = box.getCenter(new THREE.Vector3())
      // aim at the top or the front face, whichever the camera sees
      if (useAtlas.getState().view === 'section') c.z = box.max.z - 0.05 // the cut face, middle height
      else {
        c.y = Math.min(box.max.y, c.y + (box.max.y - box.min.y) * 0.3)
        c.z = Math.max(c.z, box.max.z - 0.4)
      }
      c.project(camera)
      return [((c.x + 1) / 2) * size.width, ((1 - c.y) / 2) * size.height]
    }
    const f = st0.focus
    if (f) setTimeout(() => (focusOn(f), refreshSelection()), 50)
    if (st0.view === 'logic') setTimeout(() => {
      rig.target.setTarget([-3, -2, 0])
      rig.polar.target = 0.62
      rig.dist.target = 120
    }, 60)
    if (st0.view === 'section' && st0.section.locked) setTimeout(() => faceCut(st0.section.locked!), 60)
    if (st0.view === 'masks') setTimeout(masksCamera, 60)
    if (st0.view === 'layout') setTimeout(layoutCamera, 60)
    rig.setHome({ target: [0, -2, 0] })
    rig.goHome()
    rig.handlers = {
      onDiveIn: () => {
        const st = useAtlas.getState()
        const c = st.focus ? CONTENT_BY_ID[st.focus] : null
        const device = c?.dive?.device ?? (rig.target.x.value < -3 ? 'nmos' : 'pmos')
        const via: [number, number, number] = device === 'nmos' ? [-15, 0.5, 0] : [9, 0.5, 0]
        void transition.go('transistor', { device, via })
      },
      onSurface: () => void transition.go('die'),
    }

    // direct manipulation on the window, so a drag survives leaving the model
    const el = gl.domElement
    let drag: { mode: DragMode; startY: number; start: [number, number] | null; decided: boolean } | null = null
    const onMove = (e: PointerEvent) => {
      if (!drag) return
      const st = useAtlas.getState()
      if (drag.mode === 'section') {
        const p = pointerToLayout(e, camera, el)
        if (!p) return
        if (!drag.decided && drag.start) {
          const dx = p[0] - drag.start[0]
          const dy = p[1] - drag.start[1]
          if (Math.hypot(dx, dy) < 0.8) return
          drag.decided = true
          // the plane sweeps in the direction you drag
          const axis: CutAxis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x'
          if (axis !== st.section.axis) {
            st.setSection({ axis, locked: null })
            rt.plane.snap(axis === 'y' ? p[1] : p[0])
          }
          rt.dragging = true
        }
        const ax = useAtlas.getState().section.axis
        const [lo, hi] = PLANE_RANGE[ax]
        rt.raw = clamp(ax === 'y' ? p[1] : p[0], lo, hi)
      } else {
        const pull = clamp((drag.startY - e.clientY) / 220, 0, 1.15)
        rt.tiers.forEach((t) => (t.target = pull))
      }
    }
    const onUp = () => {
      if (!drag) return
      if (drag.mode === 'section') {
        rt.dragging = false
        const st = useAtlas.getState()
        if (!st.section.locked && rt.raw != null) {
          rt.plane.target = rt.raw
          st.setSection({ offset: Math.round(rt.raw * 10) / 10 })
        }
        rt.raw = null
      } else {
        // release: back into registration one by one, top tier first
        rt.tiers.forEach((t, i) => setTimeout(() => (t.target = 0), (TIERS - 1 - i) * 110))
      }
      drag = null
    }
    beginDrag = (mode, e) => {
      rig.owner = mode
      useAtlas.getState().set({ hover: null })
      drag = { mode, startY: e.clientY, start: pointerToLayout(e, camera, el), decided: false }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      unsub()
      if (useAtlas.getState().view !== 'layout') rig.locked = false
      rig.fov.target = 32
      beginDrag = null
      rig.handlers = {}
      selection.set('hover', [])
      selection.set('focus', [])
      overlay.labels = []
      overlay.version++
      model.dispose()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [model, camera, size, gl])

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    const v = useAtlas.getState().view
    if (v !== 'section' && v !== 'masks') return
    e.stopPropagation()
    beginDrag?.(v, e.nativeEvent)
  }
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (rig.owner) return
    e.stopPropagation()
    const id = (e.object.userData.content as string | null) ?? null
    if (useAtlas.getState().hover !== id) useAtlas.getState().set({ hover: id })
  }
  const onOut = () => {
    if (useAtlas.getState().hover) useAtlas.getState().set({ hover: null })
  }
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // a press that did not move is a click, even in Section/Masks views where pressing starts a drag
    if (e.delta > 5 || rig.owner === 'orbit') return
    e.stopPropagation()
    const id = (e.object.userData.content as string | null) ?? null
    if (!id) return
    const st = useAtlas.getState()
    // mastery overlay: a weak object opens the lesson chunk that teaches it
    if (st.mastery && st.mode === 'explore') {
      const m = objectMastery(id)
      const chunk = m && (m.level === 'weak' || m.level === 'untested') ? chunkForObject(id) : null
      if (chunk) return st.set({ mode: 'lesson', chunk, mastery: false })
    }
    st.set({ focus: id })
  }

  return (
    <>
      <StudioLights />
      <primitive object={model.group} onPointerDown={onDown} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -8.05, 0]} material={grid} raycast={() => null}>
        <planeGeometry args={[220, 220]} />
      </mesh>
      <PlaneGuide />
      <FabEffects />
      <BackgroundClick />
    </>
  )
}

/** a thin amber frame marking the section plane while it is free */
function PlaneGuide() {
  const ref = useRef<THREE.LineSegments>(null)
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(8 * 3).fill(0), 3))
    return g
  }, [])
  const mat = useMemo(() => new THREE.LineBasicNodeMaterial({ color: '#f0b43c', transparent: true, opacity: 0.85 }), [])
  useFrame(() => {
    const st = useAtlas.getState()
    const l = ref.current
    if (!l) return
    l.visible = st.view === 'section' && rt.gap < 0.95
    if (!l.visible) return
    const o = rt.sectionOffset
    const [z0, z1] = [-8.4, 6]
    const pts =
      st.section.axis === 'y'
        ? [[-31.5, z0, -(o - 2)], [31.5, z0, -(o - 2)], [31.5, z1, -(o - 2)], [-31.5, z1, -(o - 2)]]
        : [[o - 25, z0, 14.5], [o - 25, z0, -14.5], [o - 25, z1, -14.5], [o - 25, z1, 14.5]]
    const seg = [0, 1, 1, 2, 2, 3, 3, 0].flatMap((i) => pts[i])
    ;(l.geometry.attributes.position as THREE.BufferAttribute).set(seg)
    l.geometry.attributes.position.needsUpdate = true
  })
  return <lineSegments ref={ref} geometry={geo} material={mat} raycast={() => null} />
}

/** clicking empty space clears the focus */
function BackgroundClick() {
  return (
    <mesh
      position={[0, 0, -200]}
      onClick={(e) => {
        if (e.delta > 5 || rig.owner) return
        if (useAtlas.getState().focus) useAtlas.getState().set({ focus: null })
      }}
    >
      <sphereGeometry args={[400, 8, 8]} />
      <meshBasicNodeMaterial side={THREE.BackSide} colorWrite={false} depthWrite={false} />
    </mesh>
  )
}

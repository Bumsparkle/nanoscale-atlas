import * as THREE from 'three/webgpu'
import { frameDt } from '../state/timescale'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { color, float, mix, uniform, positionWorld, sin, time, vec3 } from 'three/tsl'
import { inverterProcess } from '../chapters/cmos/recipe'
import { MESH_OPTS } from '../chapters/cmos/display'
import { currentMasks } from '../chapters/cmos/maskIndex'
import { displayStack } from '../sim/mesher'
import { colAt, top } from '../sim/model'
import type { Model } from '../sim/types'
import { useAtlas } from '../state/store'
import { cellRuntime as rt } from './cellRuntime'
import { CELL_CENTRE } from './cellGeometry'
import { post } from './Pipeline'
import { Spring, SPRINGS } from './spring'
import type { Step } from '../sim/recipe'

/**
 * Per-step fab effects, driven by the fractional timeline position:
 *  - implant: an ion beam; ions stop in oxide, resist or poly and penetrate exposed silicon
 *  - expose: the mask plate hovers above the wafer; light passes the clear areas
 *  - oxidise: furnace glow (900–1200 °C, slide 30)
 *  - wet etch / strip: a film of liquid over the wafer
 *  - CVD / sputter: atoms arriving from above
 *  - lithography steps: the whole scene goes to yellow-light amber
 */
const N = 700
const TOP_Y = 16

/** which step is "active" at timeline position s, and its local progress */
export function activeStep(s: number, steps: Step[]): { k: number; t: number; moving: boolean } {
  const k = Math.floor(s + 1e-9)
  const t = s - k
  if (t > 1e-4 && k + 1 < steps.length) return { k: k + 1, t, moving: true }
  return { k, t: 1, moving: false }
}

/** display height of the top surface and of the silicon surface at a layout point */
function heights(m: Model, x: number, y: number) {
  const k = colAt(m.grid, x, y)
  if (k < 0) return { surf: 0, si: 0, blocked: true }
  const col = m.cols[k]
  const st = displayStack(col, MESH_OPTS)
  const surf = st.length ? st[st.length - 1].z1 : 0
  return { surf, si: 0, blocked: top(col).mat !== 'si' }
}

function IonRain() {
  const process = { get steps() { return inverterProcess().steps }, snapshot: (k: number) => inverterProcess().snapshot(k) }
  const mesh = useRef<THREE.InstancedMesh>(null)
  const parts = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        x: -5.5 + Math.random() * 61,
        y: -11.5 + Math.random() * 27,
        phase: Math.random(),
        speed: 0.8 + Math.random() * 0.5,
        stop: 0,
        depth: 0,
        jitter: Math.random(),
      })),
    [],
  )
  const tint = useMemo(() => uniform(new THREE.Color('#9fd0ff')), [])
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    m.colorNode = tint
    return m
  }, [tint])
  const geo = useMemo(() => new THREE.SphereGeometry(0.11, 6, 4), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const lastK = useRef(-1)
  const clock = useRef(0)

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const im = mesh.current
    if (!im) return
    const { k, t } = activeStep(rt.fabPos, process.steps)
    const step = process.steps[k]
    const kind = st.view === 'fab' ? step.kind : null
    const on = kind === 'implant' || kind === 'deposit' || kind === 'sputter'
    im.visible = on
    if (!on) return
    clock.current += frameDt(dt)
    if (lastK.current !== k) {
      // ion stopping points come from the model *before* this step
      const before = process.snapshot(Math.max(0, k - 1))
      const depth = kind === 'implant' ? (step.id.startsWith('nwell') ? 1500 : 250) / MESH_OPTS.nmPerUnit : 0
      for (const p of parts) {
        const h = heights(before, p.x, p.y)
        p.stop = h.surf
        p.depth = kind === 'implant' && !h.blocked ? depth * (0.35 + 0.65 * p.jitter) : 0
      }
      lastK.current = k
      tint.value.set(kind === 'implant' ? (step.id.startsWith('p') ? '#ffc58a' : '#9fd0ff') : kind === 'sputter' ? '#e8edf2' : '#d9cbb8')
    }
    const fast = kind === 'implant' ? 1.4 : kind === 'sputter' ? 1.0 : 0.45
    for (let i = 0; i < N; i++) {
      const p = parts[i]
      const life = (clock.current * fast * p.speed + p.phase) % 1
      const travel = Math.min(1, life / 0.7)
      const fall = TOP_Y - (TOP_Y - p.stop) * travel
      // ions that reach bare silicon keep going down to their range; others stop on the blocker
      const y = travel < 1 ? fall : p.stop - p.depth * Math.min(1, (life - 0.7) / 0.15)
      const s = (life > 0.9 ? 1 - (life - 0.9) / 0.1 : 1) * (kind === 'deposit' ? 0.7 : 1)
      dummy.position.set(p.x - CELL_CENTRE.x + (kind === 'deposit' ? Math.sin(clock.current * 2 + p.phase * 9) * 0.3 : 0), y, -(p.y - CELL_CENTRE.y))
      dummy.scale.setScalar(s * (travel < 1 ? 1 : 0.8) * (t > 0 || !rt.fabPos ? 1 : 1))
      if (kind === 'implant' && travel < 1) dummy.scale.set(s * 0.6, s * 3.2, s * 0.6) // streak while in flight
      dummy.updateMatrix()
      im.setMatrixAt(i, dummy.matrix)
    }
    im.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[geo, mat, N]} frustumCulled={false} raycast={() => null} />
}

/** clear/opaque rectangles of a mask over the cell, as greedy boxes on the λ grid */
function maskRects(maskId: string, keep: boolean, clear: boolean) {
  const mask = currentMasks()[maskId]
  const out: { x0: number; x1: number; y0: number; y1: number }[] = []
  const nx = 62
  const ny = 28
  const lit = new Uint8Array(nx * ny)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const x = -6 + i + 0.5
      const y = -12 + j + 0.5
      const inside = mask.rects.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)
      lit[j * nx + i] = (inside !== keep) === clear ? 1 : 0
    }
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      if (lit[j * nx + i] !== 1) continue
      let i1 = i
      while (i1 + 1 < nx && lit[j * nx + i1 + 1] === 1) i1++
      let j1 = j
      grow: while (j1 + 1 < ny) {
        for (let ii = i; ii <= i1; ii++) if (lit[(j1 + 1) * nx + ii] !== 1) break grow
        j1++
      }
      for (let jj = j; jj <= j1; jj++) for (let ii = i; ii <= i1; ii++) lit[jj * nx + ii] = 2
      out.push({ x0: -6 + i, x1: -6 + i1 + 1, y0: -12 + j, y1: -12 + j1 + 1 })
    }
  return out
}

function boxGroup(rects: { x0: number; x1: number; y0: number; y1: number }[], y0: number, y1: number) {
  const geos: THREE.BufferGeometry[] = []
  for (const r of rects) {
    const g = new THREE.BoxGeometry(r.x1 - r.x0, y1 - y0, r.y1 - r.y0)
    g.translate((r.x0 + r.x1) / 2 - CELL_CENTRE.x, (y0 + y1) / 2, -((r.y0 + r.y1) / 2 - CELL_CENTRE.y))
    geos.push(g)
  }
  return geos
}

function mergeGeos(geos: THREE.BufferGeometry[]) {
  // tiny local merge (avoids pulling in BufferGeometryUtils)
  const pos: number[] = []
  const nor: number[] = []
  const idx: number[] = []
  let base = 0
  for (const g of geos) {
    const p = g.attributes.position.array
    const n = g.attributes.normal.array
    for (let i = 0; i < p.length; i++) pos.push(p[i])
    for (let i = 0; i < n.length; i++) nor.push(n[i])
    const ii = g.index!.array
    for (let i = 0; i < ii.length; i++) idx.push(ii[i] + base)
    base += p.length / 3
    g.dispose()
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  out.setIndex(idx)
  return out
}

/** mask plate (chrome on glass) hovering over the wafer + light through the clear areas */
function Exposure() {
  const process = { get steps() { return inverterProcess().steps }, snapshot: (k: number) => inverterProcess().snapshot(k) }
  const plate = useRef<THREE.Mesh>(null)
  const glass = useRef<THREE.Mesh>(null)
  const beam = useRef<THREE.Mesh>(null)
  const intensity = useMemo(() => uniform(0), [])
  const chromeMat = useMemo(() => new THREE.MeshStandardNodeMaterial({ color: '#2a2d30', metalness: 0.9, roughness: 0.25 }), [])
  const glassMat = useMemo(() => {
    const m = new THREE.MeshPhysicalNodeMaterial({ transparent: true, depthWrite: false, roughness: 0.05 })
    m.colorNode = color('#9fb4c4')
    m.opacityNode = float(0.12)
    return m
  }, [])
  const beamMat = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    const shimmer = sin(positionWorld.y.mul(3).sub(time.mul(6))).mul(0.15).add(0.85)
    m.colorNode = vec3(0.62, 0.74, 0.95)
    m.opacityNode = intensity.mul(0.085).mul(shimmer)
    return m
  }, [intensity])
  const current = useRef('')
  const fade = useRef(new Spring(0, SPRINGS.ui))

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const { k, t, moving } = activeStep(rt.fabPos, process.steps)
    const step = process.steps[k]
    const on = st.view === 'fab' && step.kind === 'expose'
    fade.current.target = on ? 1 : 0
    const f = fade.current.step(frameDt(dt), st.reducedMotion)
    const show = f > 0.01
    for (const r of [plate, glass, beam]) if (r.current) r.current.visible = show
    if (!show) return
    const id = step.mask! + (step.id.startsWith('gate') || step.id.startsWith('metal') ? ':keep' : '')
    if (current.current !== id && on) {
      current.current = id
      const keep = id.endsWith(':keep')
      const maskId = step.mask!
      const before = process.snapshot(Math.max(0, k - 1))
      // resist top: planarised, so any column will do
      const resTop = heights(before, -5.5, -11.5).surf
      const PLATE = TOP_Y - 2
      plate.current!.geometry.dispose()
      plate.current!.geometry = mergeGeos(boxGroup(maskRects(maskId, keep, false), PLATE, PLATE + 0.25))
      beam.current!.geometry.dispose()
      beam.current!.geometry = mergeGeos(boxGroup(maskRects(maskId, keep, true), resTop + 0.02, PLATE))
    }
    plate.current!.position.y = (1 - f) * 6
    glass.current!.position.y = (1 - f) * 6
    intensity.value = f * (moving ? Math.sin(Math.PI * Math.min(1, t * 1.15)) : 0.7)
  })
  return (
    <>
      <mesh ref={plate} material={chromeMat} raycast={() => null} />
      <mesh ref={glass} material={glassMat} position={[0, TOP_Y - 2 + 0.3, 0]} raycast={() => null}>
        <boxGeometry args={[62, 0.3, 28]} />
      </mesh>
      <mesh ref={beam} material={beamMat} raycast={() => null} renderOrder={9} />
    </>
  )
}

/** furnace glow for oxidation and CVD; liquid sheen for wet steps */
function Ambience() {
  const process = { get steps() { return inverterProcess().steps }, snapshot: (k: number) => inverterProcess().snapshot(k) }
  const light = useRef<THREE.PointLight>(null)
  const sheet = useRef<THREE.Mesh>(null)
  const wet = useMemo(() => uniform(0), [])
  const sheetMat = useMemo(() => {
    const m = new THREE.MeshPhysicalNodeMaterial({ transparent: true, depthWrite: false, roughness: 0.02, metalness: 0 })
    // long, slow swell across the bath rather than a grid of ripples
    const ripple = sin(positionWorld.x.mul(0.22).add(positionWorld.z.mul(0.13)).add(time.mul(0.9))).mul(0.5).add(0.5)
    m.colorNode = mix(color('#2f4552'), color('#7aa3b8'), ripple)
    m.opacityNode = wet.mul(0.13)
    return m
  }, [wet])
  const glow = useRef(new Spring(0, SPRINGS.gentle))
  const amber = useRef(new Spring(0, SPRINGS.gentle))
  const wetS = useRef(new Spring(0, SPRINGS.gentle))

  useFrame((_, dt) => {
    const st = useAtlas.getState()
    const fab = st.view === 'fab'
    const { k } = activeStep(rt.fabPos, process.steps)
    const step = process.steps[k]
    const hot = fab && (step.kind === 'oxidise' || (step.kind === 'deposit' && step.id !== 'fox'))
    const litho = fab && (step.kind === 'spin' || step.kind === 'expose' || step.kind === 'develop')
    const isWet = fab && (step.kind === 'strip' || (step.kind === 'etch' && step.chemistry.includes('HF')) || step.kind === 'develop')
    glow.current.target = hot ? 1 : 0
    amber.current.target = litho ? 1 : 0
    wetS.current.target = isWet ? 1 : 0
    const g = glow.current.step(dt, st.reducedMotion)
    if (light.current) light.current.intensity = g * 2600
    post.amber.value = amber.current.step(dt, st.reducedMotion) * 0.85
    wet.value = wetS.current.step(dt, st.reducedMotion)
    if (sheet.current) {
      sheet.current.visible = wet.value > 0.01
      sheet.current.position.y = 4.6
    }
  })
  return (
    <>
      <pointLight ref={light} position={[0, 18, 10]} color="#ff7a2a" intensity={0} distance={120} decay={1.6} />
      <mesh ref={sheet} material={sheetMat} rotation-x={-Math.PI / 2} raycast={() => null} renderOrder={8}>
        <planeGeometry args={[62, 28]} />
      </mesh>
    </>
  )
}

export function FabEffects() {
  return (
    <>
      <IonRain />
      <Exposure />
      <Ambience />
    </>
  )
}
